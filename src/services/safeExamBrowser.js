const SEB_PENDING_LAUNCH_KEY = "seb_pending_quiz_launch";
const SEB_ACTIVE_LAUNCH_KEY = "seb_active_quiz_launch";
const SEB_FLOW_TOKEN_KEY = "seb_flow_token";
const SEB_LAST_LAUNCH_ATTEMPT_KEY = "seb_last_launch_attempt";
const SEB_ACTIVE_LAUNCH_MAX_AGE_MS = 1000 * 60 * 60;
const SEB_FLOW_TOKEN_MAX_AGE_MS = 1000 * 60 * 5; // 5 minutes
const SEB_RETRY_COOLDOWN_MS = 3500;

function normalizeText(value) {
  return String(value || "").trim();
}

function readJsonStorage(key) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJsonStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function generateFlowToken() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isValidFlowToken() {
  if (typeof window === "undefined") {
    return false;
  }

  const token = readJsonStorage(SEB_FLOW_TOKEN_KEY);
  if (!token || !token.createdAt) {
    return false;
  }

  const age = Date.now() - Number(token.createdAt);
  return age < SEB_FLOW_TOKEN_MAX_AGE_MS;
}

export function createFlowToken() {
  if (typeof window === "undefined") {
    return;
  }

  writeJsonStorage(SEB_FLOW_TOKEN_KEY, {
    token: generateFlowToken(),
    createdAt: Date.now()
  });
}

export function clearFlowToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SEB_FLOW_TOKEN_KEY);
}

export function isInsideSafeExamBrowser(quizKey = "") {
  if (typeof navigator === "undefined") {
    return false;
  }

  // Strict enforcement: allow only real SEB user agent.
  if (/seb/i.test(String(navigator.userAgent || ""))) {
    return true;
  }

  return false;
}

export function createQuizKey({ category, quizTitle }) {
  const normalizedCategory = normalizeText(category).toLowerCase();
  const normalizedQuizTitle = normalizeText(quizTitle).toLowerCase();
  return `${normalizedCategory}::${normalizedQuizTitle}`;
}

export function buildQuizQuery(category, quizTitle, mode = "assessment") {
  const params = new URLSearchParams();
  const normalizedCategory = normalizeText(category);
  const normalizedQuizTitle = normalizeText(quizTitle);
  const normalizedMode = normalizeText(mode).toLowerCase();

  if (normalizedCategory) {
    params.set("category", normalizedCategory);
  }
  if (normalizedQuizTitle) {
    params.set("quizTitle", normalizedQuizTitle);
  }
  if (normalizedMode) {
    params.set("mode", normalizedMode);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildSafeExamBrowserLaunchUrl() {
  const configured = normalizeText(import.meta.env.VITE_SEB_LAUNCH_URL);
  if (configured) {
    return configured;
  }

  if (typeof window === "undefined") {
    return "";
  }

  const basePath = normalizeText(import.meta.env.BASE_URL);
  const normalizedBasePath = basePath
    ? (basePath.startsWith("/") ? basePath : `/${basePath}`).replace(/\/?$/, "/")
    : (window.location.pathname.includes("/career-portal/") ? "/career-portal/" : "/");

  try {
    const sebConfigUrl = new URL("seb/quiz.seb", `${window.location.origin}${normalizedBasePath}`);
    return sebConfigUrl.toString();
  } catch {
    const guessedBase = window.location.pathname.includes("/career-portal/") ? "/career-portal/" : "/";
    return `${window.location.origin}${guessedBase}seb/quiz.seb`;
  }
}

function triggerSebDirectLaunch(sebConfigUrl) {
  // Get the quiz URL to open directly in SEB
  const basePath = normalizeText(import.meta.env.BASE_URL) || "/career-portal/";
  const quizUrl = `${window.location.origin}${basePath}seb-launch`;
  
  // SEB can be launched via seb:// URL scheme or by opening the config file
  // Try using the seb:// protocol first
  const sebProtocolUrl = `seb://${window.location.host}${basePath}seb/quiz.seb`;
  
  // Create a link and open it - this should trigger SEB if installed
  const link = document.createElement("a");
  link.href = sebProtocolUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  
  // Try to open with seb:// protocol
  link.click();
  
  // Fallback: also try opening the config file URL directly
  setTimeout(() => {
    window.open(sebConfigUrl, "_blank");
  }, 500);
  
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  }, 100);
}

function readSebLastLaunchAttemptAt() {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(SEB_LAST_LAUNCH_ATTEMPT_KEY);
  const value = Number(raw || 0);
  return Number.isFinite(value) ? value : 0;
}

function markSebLaunchAttemptNow() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SEB_LAST_LAUNCH_ATTEMPT_KEY, String(Date.now()));
}

export function getSebLaunchCooldownRemainingMs() {
  const lastAttemptAt = readSebLastLaunchAttemptAt();
  if (lastAttemptAt <= 0) {
    return 0;
  }

  const elapsed = Date.now() - lastAttemptAt;
  const remaining = SEB_RETRY_COOLDOWN_MS - elapsed;
  return remaining > 0 ? remaining : 0;
}

export function storePendingSebLaunch({ category, quizTitle, mode = "assessment" }) {
  if (typeof window === "undefined") {
    return;
  }

  writeJsonStorage(SEB_PENDING_LAUNCH_KEY, {
    category: normalizeText(category),
    quizTitle: normalizeText(quizTitle),
    mode: normalizeText(mode) || "assessment",
    createdAt: Date.now()
  });
}

export function readPendingSebLaunch() {
  const pending = readJsonStorage(SEB_PENDING_LAUNCH_KEY);
  if (!pending || typeof pending !== "object") {
    return null;
  }

  return {
    category: normalizeText(pending.category),
    quizTitle: normalizeText(pending.quizTitle),
    mode: normalizeText(pending.mode) || "assessment",
    createdAt: Number(pending.createdAt || 0)
  };
}

export function clearPendingSebLaunch() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SEB_PENDING_LAUNCH_KEY);
}

export function markSebLaunchActive(quizKey) {
  if (typeof window === "undefined" || !quizKey) {
    return;
  }

  writeJsonStorage(SEB_ACTIVE_LAUNCH_KEY, {
    quizKey,
    launchedAt: Date.now()
  });
}

export function clearSebLaunchActive() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SEB_ACTIVE_LAUNCH_KEY);
}

export function attemptSafeExamBrowserLaunch({ quizKey, category, quizTitle, mode }) {
  if (typeof window === "undefined") {
    return false;
  }

  if (!quizKey) {
    return false;
  }

  if (isInsideSafeExamBrowser(quizKey)) {
    return false;
  }

  if (getSebLaunchCooldownRemainingMs() > 0) {
    return false;
  }

  clearSebLaunchActive();
  clearFlowToken();

  // Store pending quiz info but DON'T mark as active yet
  // Only mark as active when SEB actually loads the page (user agent will have "seb")
  storePendingSebLaunch({ category, quizTitle, mode });
  createFlowToken();

  // Get the .seb config file URL
  const sebConfigUrl = buildSafeExamBrowserLaunchUrl();
  if (!sebConfigUrl) {
    console.error("Could not build SEB URL");
    return false;
  }

  try {
    markSebLaunchAttemptNow();
    triggerSebDirectLaunch(sebConfigUrl);

    return true;
  } catch (error) {
    console.error("Failed to launch SEB:", error);
    return false;
  }
}






