package com.example.full.project.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

@Service   // ⭐ VERY IMPORTANT
public class HuggingFaceService {

    @Value("${huggingface.api.key}")
    private String apiKey;

    private static final String API_URL =
            "https://api-inference.huggingface.co/models/google/flan-t5-large";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate;

    public HuggingFaceService(RestTemplateBuilder builder) {
      this.restTemplate = builder
          .setConnectTimeout(Duration.ofSeconds(20))
          .setReadTimeout(Duration.ofSeconds(90))
          .build();
    }

    public String generateQuiz(String prompt) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        String body = """
        {
        "inputs": "%s",
        "parameters": {
        "max_new_tokens": 900,
        "temperature": 0.2,
        "return_full_text": false
        },
        "options": {
        "wait_for_model": true,
        "use_cache": false
        }
        }
      """.formatted(
          prompt
              .replace("\\", "\\\\")
              .replace("\"", "\\\"")
              .replace("\n", "\\n")
      );

        HttpEntity<String> request = new HttpEntity<>(body, headers);

      try {
        ResponseEntity<String> response =
            restTemplate.postForEntity(API_URL, request, String.class);
        return normalizeResponseToJsonArray(response.getBody());
      } catch (HttpStatusCodeException ex) {
        String details = ex.getResponseBodyAsString();
        throw new RuntimeException("AI generation request failed: " + details);
      }
    }

    private String normalizeResponseToJsonArray(String rawResponse) {
      if (rawResponse == null || rawResponse.isBlank()) {
        throw new RuntimeException("Empty AI response");
      }

      try {
        JsonNode root = objectMapper.readTree(rawResponse);

        if (root.isObject() && root.has("error")) {
          throw new RuntimeException(root.get("error").asText());
        }

        if (root.isArray() && root.size() > 0 && root.get(0).has("generated_text")) {
          String generated = root.get(0).get("generated_text").asText();
          return extractJsonArray(generated);
        }

        if (root.isObject() && root.has("generated_text")) {
          String generated = root.get("generated_text").asText();
          return extractJsonArray(generated);
        }

        return extractJsonArray(rawResponse);
      } catch (Exception parseException) {
        return extractJsonArray(rawResponse);
      }
    }

    private String extractJsonArray(String text) {
      int start = text.indexOf("[");
      int end = text.lastIndexOf("]");

      if (start >= 0 && end > start) {
        return text.substring(start, end + 1);
      }

      throw new RuntimeException("AI response did not contain quiz JSON array");
    }
}
