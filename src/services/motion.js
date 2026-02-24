export const MOTION_KEY = "motion_mode";

export function getPreferredMotion() {
  const savedMotion = localStorage.getItem(MOTION_KEY);
  if (savedMotion === "reduced" || savedMotion === "normal") {
    return savedMotion;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "normal";
}

export function getCurrentMotion() {
  const current = document.documentElement.getAttribute("data-motion");
  if (current === "reduced" || current === "normal") {
    return current;
  }

  return getPreferredMotion();
}

export function applyMotion(motion) {
  const resolved = motion === "reduced" ? "reduced" : "normal";
  document.documentElement.setAttribute("data-motion", resolved);
  localStorage.setItem(MOTION_KEY, resolved);
  return resolved;
}

export function toggleMotion() {
  const next = getCurrentMotion() === "reduced" ? "normal" : "reduced";
  return applyMotion(next);
}
