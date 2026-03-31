export function resolveRuntimeBasePath() {
  const configuredBase = import.meta.env.BASE_URL || "/";
  const normalizedConfiguredBase = configuredBase.startsWith("/")
    ? configuredBase.replace(/\/$/, "") || "/"
    : "/";

  if (
    normalizedConfiguredBase !== "/" &&
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith(normalizedConfiguredBase)
  ) {
    return "/";
  }

  return normalizedConfiguredBase;
}

export function withResolvedBase(path) {
  const base = resolveRuntimeBasePath();
  return `${base}${String(path).replace(/^\/+/, "")}`;
}
