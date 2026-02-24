const AUTH_KEY = "frontend_logged_in";
const ROLE_KEY = "frontend_user_role";

export function normalizeRole(role) {
  const raw = String(role || "").trim();
  if (!raw) return "";

  const upper = raw.toUpperCase().replace(/^ROLE_/, "");

  if (upper.includes("ADMIN")) return "ADMIN";
  if (upper.includes("USER")) return "USER";

  return upper;
}

export function setLoggedIn(value) {
  if (value) {
    localStorage.setItem(AUTH_KEY, "true");
    return;
  }
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function setRole(role) {
  const normalized = normalizeRole(role);

  if (!normalized) {
    localStorage.removeItem(ROLE_KEY);
    return;
  }

  localStorage.setItem(ROLE_KEY, normalized);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || "";
}