const ATTEMPTS_KEY = "career_attempts";

export function getAttempts() {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt) {
  const attempts = getAttempts();
  const updated = [attempt, ...attempts].slice(0, 30);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(updated));
}

export function clearAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
}