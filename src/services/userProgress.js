const ATTEMPTS_KEY = "career_attempts";
const ATTEMPTS_FALLBACK_KEY = "career_attempts_fallback";

export function getAttempts() {
  const read = (key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const primary = read(ATTEMPTS_KEY);
  const fallback = read(ATTEMPTS_FALLBACK_KEY);

  if (primary.length === 0 && fallback.length > 0) {
    return fallback;
  }

  if (fallback.length === 0) {
    return primary;
  }

  const merged = [...primary, ...fallback]
    .filter(Boolean)
    .sort((a, b) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0));

  const uniqueById = [];
  const seen = new Set();
  for (const item of merged) {
    const key = String(item?.id || `${item?.timestamp || ""}-${item?.quizTitle || ""}`).trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueById.push(item);
  }

  return uniqueById.slice(0, 30);
}

export function saveAttempt(attempt) {
  const attempts = getAttempts();
  const updated = [attempt, ...attempts].slice(0, 30);

  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(updated));
  } catch {
    localStorage.setItem(ATTEMPTS_FALLBACK_KEY, JSON.stringify(updated));
  }
}

export function clearAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(ATTEMPTS_FALLBACK_KEY);
}