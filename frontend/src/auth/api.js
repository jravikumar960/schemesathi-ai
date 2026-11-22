export function csrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("schemesathi_csrf="));

  return cookie
    ? decodeURIComponent(cookie.substring("schemesathi_csrf=".length))
    : "";
}

export async function authRequest(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const token = csrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }

  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item) => {
          const field = Array.isArray(item.loc)
            ? item.loc.join(".")
            : "request";
          return `${field}: ${item.msg}`;
        }).join("; ")
      : typeof data.detail === "string"
        ? data.detail
        : `Request failed (${response.status})`;

    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return data;
}
