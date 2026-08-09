let installed = false;

function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL?.trim() || "").replace(/\/$/, "");
}

function rewriteApiInput(input: RequestInfo | URL): RequestInfo | URL {
  const base = apiBaseUrl();
  if (!base) return input;

  if (typeof input === "string") {
    return input.startsWith("/api/") ? `${base}${input}` : input;
  }
  if (input instanceof URL) {
    return input.pathname.startsWith("/api/")
      ? new URL(`${base}${input.pathname}${input.search}`)
      : input;
  }
  const url = new URL(input.url, window.location.origin);
  return url.pathname.startsWith("/api/")
    ? new Request(`${base}${url.pathname}${url.search}`, input)
    : input;
}

export function installApiFetchPatch(): void {
  if (installed || !apiBaseUrl()) return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    nativeFetch(rewriteApiInput(input), {
      ...init,
      credentials: init?.credentials ?? "include",
      cache: init?.cache ?? "no-store",
    });
  installed = true;
}
