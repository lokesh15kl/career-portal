package com.example.full.project;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FullProjectApplication {

    private static final String FALLBACK_H2_URL = "jdbc:h2:mem:careerportal;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";

    public static void main(String[] args) {
        normalizeDatabaseUrl();
        ensureDatabaseAvailable();
        SpringApplication.run(FullProjectApplication.class, args);
    }

    private static void normalizeDatabaseUrl() {
        String jdbcUrl = sanitizeUrl(System.getenv("JDBC_DATABASE_URL"));
        if (jdbcUrl != null && !jdbcUrl.isBlank()) {
            normalizeAndApply(jdbcUrl);
            return;
        }

        String rawUrl = sanitizeUrl(System.getenv("DATABASE_URL"));
        if (rawUrl != null && !rawUrl.isBlank()) {
            normalizeAndApply(rawUrl);
        }
    }

    private static void normalizeAndApply(String rawUrl) {
        if (startsWithIgnoreCase(rawUrl, "jdbc:")) {
            System.setProperty("spring.datasource.url", rawUrl);
            applyDriverAndDialectForJdbc(rawUrl);
            return;
        }

        if (startsWithIgnoreCase(rawUrl, "postgres://") || startsWithIgnoreCase(rawUrl, "postgresql://")) {
            applyJdbcProperties(rawUrl, "postgresql");
            return;
        }

        if (startsWithIgnoreCase(rawUrl, "mysql://")) {
            applyJdbcProperties(rawUrl, "mysql");
        }
    }

    private static String sanitizeUrl(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        if (trimmed.length() >= 2) {
            char first = trimmed.charAt(0);
            char last = trimmed.charAt(trimmed.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return trimmed.substring(1, trimmed.length() - 1).trim();
            }
        }
        return trimmed;
    }

    private static boolean startsWithIgnoreCase(String value, String prefix) {
        return value.regionMatches(true, 0, prefix, 0, prefix.length());
    }

    private static void applyDriverAndDialectForJdbc(String jdbcUrl) {
        if (startsWithIgnoreCase(jdbcUrl, "jdbc:postgresql:")) {
            System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");
            return;
        }

        if (startsWithIgnoreCase(jdbcUrl, "jdbc:mysql:")) {
            System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.MySQLDialect");
            return;
        }

        if (startsWithIgnoreCase(jdbcUrl, "jdbc:h2:")) {
            System.setProperty("spring.datasource.driver-class-name", "org.h2.Driver");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.H2Dialect");
        }
    }

    private static void ensureDatabaseAvailable() {
        boolean allowFallback = shouldAllowEmbeddedFallback();
        String jdbcUrl = System.getProperty("spring.datasource.url");
        if (jdbcUrl == null || jdbcUrl.isBlank()) {
            if (allowFallback) {
                useFallbackDatabase();
                return;
            }

            throw new IllegalStateException(
                "No persistent database configured. Set JDBC_DATABASE_URL, DATABASE_USERNAME, and DATABASE_PASSWORD.");
            return;
        }

        String username = System.getProperty("spring.datasource.username", "");
        String password = System.getProperty("spring.datasource.password", "");

        try {
            DriverManager.setLoginTimeout(5);
            try (Connection ignored = DriverManager.getConnection(jdbcUrl, username, password)) {
                return;
            }
        } catch (SQLException ex) {
            if (allowFallback) {
                useFallbackDatabase();
                return;
            }

            throw new IllegalStateException(
                "Failed to connect to persistent database. Verify JDBC_DATABASE_URL, DATABASE_USERNAME, and DATABASE_PASSWORD.",
                ex);
        }
    }

    private static boolean shouldAllowEmbeddedFallback() {
        String explicit = sanitizeUrl(System.getenv("ALLOW_EMBEDDED_DB_FALLBACK"));
        if (explicit != null && !explicit.isBlank()) {
            return "true".equalsIgnoreCase(explicit);
        }

        boolean runningOnRender = !isBlank(System.getenv("RENDER"))
            || !isBlank(System.getenv("RENDER_SERVICE_ID"));

        // Default: allow fallback only for local environments.
        return !runningOnRender;
    }

    private static boolean isBlank(String value) {
        return value == null || value.trim().isBlank();
    }

    private static void useFallbackDatabase() {
        System.setProperty("spring.datasource.url", FALLBACK_H2_URL);
        System.setProperty("spring.datasource.driver-class-name", "org.h2.Driver");
        System.setProperty("spring.datasource.username", "sa");
        System.setProperty("spring.datasource.password", "");
        System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.H2Dialect");
    }

    private static void applyJdbcProperties(String rawUrl, String driverType) {
        try {
            URI uri = URI.create(rawUrl);
            String host = uri.getHost();
            String path = uri.getPath();

            if (host == null || path == null || path.isBlank()) {
                return;
            }

            StringBuilder jdbcUrlBuilder = new StringBuilder("jdbc:")
                    .append(driverType)
                    .append("://")
                    .append(host);

            if (uri.getPort() > 0) {
                jdbcUrlBuilder.append(':').append(uri.getPort());
            }

            jdbcUrlBuilder.append(path);

            if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
                jdbcUrlBuilder.append('?').append(uri.getQuery());
            }

            String jdbcUrl = jdbcUrlBuilder.toString();
            System.setProperty("spring.datasource.url", jdbcUrl);
            applyDriverAndDialectForJdbc(jdbcUrl);

            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isBlank()) {
                String[] credentials = userInfo.split(":", 2);
                String explicitUsername = System.getenv("DATABASE_USERNAME");
                String explicitPassword = System.getenv("DATABASE_PASSWORD");

                if ((explicitUsername == null || explicitUsername.isBlank())
                        && credentials.length > 0
                        && !credentials[0].isBlank()) {
                    System.setProperty("spring.datasource.username", URLDecoder.decode(credentials[0], StandardCharsets.UTF_8));
                }
                if ((explicitPassword == null || explicitPassword.isBlank()) && credentials.length > 1) {
                    System.setProperty("spring.datasource.password", URLDecoder.decode(credentials[1], StandardCharsets.UTF_8));
                }
            }
        } catch (IllegalArgumentException ignored) {
            String convertedUrl = null;
            if ("postgresql".equals(driverType)) {
                if (startsWithIgnoreCase(rawUrl, "postgres://")) {
                    convertedUrl = "jdbc:postgresql://" + rawUrl.substring("postgres://".length());
                } else if (startsWithIgnoreCase(rawUrl, "postgresql://")) {
                    convertedUrl = "jdbc:postgresql://" + rawUrl.substring("postgresql://".length());
                }
            } else if ("mysql".equals(driverType) && startsWithIgnoreCase(rawUrl, "mysql://")) {
                convertedUrl = "jdbc:mysql://" + rawUrl.substring("mysql://".length());
            }

            if (convertedUrl != null && !convertedUrl.isBlank()) {
                System.setProperty("spring.datasource.url", convertedUrl);
                applyDriverAndDialectForJdbc(convertedUrl);
            }
        }
    }

}
