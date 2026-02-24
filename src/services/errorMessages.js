export const SERVICE_MESSAGES = {
  AI_UNAVAILABLE: "ChatGPT quiz generation is temporarily unavailable. Please try again later or contact support.",
  BACKEND_OFFLINE: "Backend service is offline. Make sure the Spring Boot server is running.",
  PARSE_ERROR: "Could not parse AI response. The fallback quiz has been created instead.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again."
};

export function getErrorMessage(error) {
  if (!error) return SERVICE_MESSAGES.NETWORK_ERROR;

  const message = error.message || String(error);

  if (message.includes("unavailable")) return SERVICE_MESSAGES.AI_UNAVAILABLE;
  if (message.includes("not reachable")) return SERVICE_MESSAGES.BACKEND_OFFLINE;
  if (message.includes("parse") || message.includes("JSON")) return SERVICE_MESSAGES.PARSE_ERROR;
  if (message.includes("401") || message.includes("Unauthorized")) return SERVICE_MESSAGES.SESSION_EXPIRED;

  return message;
}

export function isAIServiceError(error) {
  const message = error?.message || "";
  return message.includes("unavailable") || message.includes("AI service");
}
