package com.example.full.project;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FullProjectApplication {

    public static void main(String[] args) {
        normalizeDatabaseUrl();
        SpringApplication.run(FullProjectApplication.class, args);
    }

    private static void normalizeDatabaseUrl() {
        String rawUrl = sanitizeUrl(System.getenv("DATABASE_URL"));
        if (rawUrl == null || rawUrl.isBlank() || startsWithIgnoreCase(rawUrl, "jdbc:")) {
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

            System.setProperty("spring.datasource.url", jdbcUrlBuilder.toString());

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
            }
        }
    }

}
