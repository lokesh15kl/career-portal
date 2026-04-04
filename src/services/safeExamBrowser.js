const SEB_SESSION_KEY = "seb_attempted_quiz_key";

function normalizeText(value) {
  return String(value || "").trim();
}

export function isInsideSafeExamBrowser() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /seb/i.test(String(navigator.userAgent || ""));
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

export function buildSafeExamBrowserLaunchUrl(examUrl) {
  const configured = normalizeText(import.meta.env.VITE_SEB_LAUNCH_URL);
  if (configured) {
    return configured;
  }

  const normalizedExamUrl = normalizeText(examUrl);
  if (!normalizedExamUrl) {
    return "";
  }

  // SEB custom protocols are intended for .seb config resources.
  // A plain quiz web URL often triggers "configuration resource is not supported".
  if (!/\.seb([?#].*)?$/i.test(normalizedExamUrl)) {
    return "";
  }

  try {
    const parsed = new URL(normalizedExamUrl);
    const route = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (parsed.protocol === "https:") {
      return `sebs://${route}`;
    }

    if (parsed.protocol === "http:") {
      return `seb://${route}`;
    }

    return `seb://${route}`;
  } catch {
    const withoutProtocol = normalizedExamUrl.replace(/^https?:\/\//i, "");
    return `seb://${withoutProtocol}`;
  }
}

export function hasAttemptedSebLaunch(quizKey) {
  if (typeof window === "undefined" || !quizKey) {
    return false;
  }

  return window.sessionStorage.getItem(SEB_SESSION_KEY) === quizKey;
}

export function markSebLaunchAttempted(quizKey) {
  if (typeof window === "undefined" || !quizKey) {
    return;
  }

  window.sessionStorage.setItem(SEB_SESSION_KEY, quizKey);
}

export function attemptSafeExamBrowserLaunch({ examUrl, quizKey }) {
  if (typeof window === "undefined") {
    return false;
  }

  if (!examUrl || !quizKey) {
    return false;
  }

  if (isInsideSafeExamBrowser() || hasAttemptedSebLaunch(quizKey)) {
    return false;
  }

  const launchUrl = buildSafeExamBrowserLaunchUrl(examUrl);
  markSebLaunchAttempted(quizKey);
  window.location.assign(launchUrl);
  return true;
}