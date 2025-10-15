const DEFAULT_BASE_URL = "/api";
const ENV_BASE =
  typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : DEFAULT_BASE_URL;

function resolveOrigin() {
  if (typeof window !== "undefined" && window.location) {
    return window.location.origin;
  }
  return "http://localhost";
}

function resolveBaseUrl() {
  return ENV_BASE || DEFAULT_BASE_URL;
}

function buildURL(path, query) {
  const base = resolveBaseUrl();
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  let url;
  if (/^https?:\/\//i.test(normalizedBase)) {
    url = new URL(`${normalizedBase}${normalizedPath}`);
  } else {
    url = new URL(`${normalizedBase}${normalizedPath}`, resolveOrigin());
  }

  if (query && typeof query === "object") {
    const normalizedQuery = camelCaseKeys(query);
    Object.entries(normalizedQuery).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, item));
      } else {
        url.searchParams.append(key, value);
      }
    });
  }
  return url.toString();
}

const isPlainObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  (value.constructor === Object || Object.getPrototypeOf(value) === null);

const toCamelKey = (key) =>
  key
    .toString()
    .replace(/([-_][a-z])/gi, (s) => s.slice(1).toUpperCase());

const toSnakeKey = (key) =>
  key
    .toString()
    .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`)
    .replace(/[-\s]+/g, "_");

const transformKeysDeep = (value, transformer) => {
  if (Array.isArray(value)) {
    return value.map((item) => transformKeysDeep(item, transformer));
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.entries(value).reduce((acc, [key, val]) => {
    const transformedKey = transformer(key);
    acc[transformedKey] = transformKeysDeep(val, transformer);
    return acc;
  }, {});
};

const camelCaseKeys = (value) => transformKeysDeep(value, toCamelKey);

const addSnakeAliases = (value) => {
  if (Array.isArray(value)) {
    return value.map(addSnakeAliases);
  }
  if (!isPlainObject(value)) {
    return value;
  }
  return Object.entries(value).reduce((acc, [key, val]) => {
    const processed = addSnakeAliases(val);
    acc[key] = processed;
    const snakeKey = toSnakeKey(key);
    if (snakeKey !== key) {
      acc[snakeKey] = processed;
    }
    return acc;
  }, {});
};

async function request(path, { method = "GET", body, query, headers } = {}) {
  const url = buildURL(path, query);
  const isJsonBody = body && typeof body === "object" && !(body instanceof FormData);

  const response = await fetch(url, {
    method,
    headers: {
      ...(isJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: isJsonBody ? JSON.stringify(camelCaseKeys(body)) : body,
  });

  let payload = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const raw = await response.json();
    payload = addSnakeAliases(camelCaseKeys(raw));
  } else {
    payload = await response.text();
  }

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || response.statusText;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return payload;
}

export const httpClient = {
  get: (path, options) => request(path, { method: "GET", ...(options || {}) }),
  post: (path, body, options) => request(path, { method: "POST", body, ...(options || {}) }),
  put: (path, body, options) => request(path, { method: "PUT", body, ...(options || {}) }),
  del: (path, options) => request(path, { method: "DELETE", ...(options || {}) }),
};

export { buildURL };
