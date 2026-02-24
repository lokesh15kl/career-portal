export const THEME_KEY = "theme_mode";

export function getPreferredTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getCurrentTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  if (current === "dark" || current === "light") {
    return current;
  }

  return getPreferredTheme();
}

export function applyTheme(theme) {
  const resolved = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", resolved);
  localStorage.setItem(THEME_KEY, resolved);
  return resolved;
}

export function toggleTheme() {
  const next = getCurrentTheme() === "dark" ? "light" : "dark";
  return applyTheme(next);
}
