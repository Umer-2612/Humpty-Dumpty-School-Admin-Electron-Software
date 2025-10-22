import crypto from "crypto";

export const SESSION_COOKIE_NAME = "humpty_session";
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS ?? 1000 * 60 * 60 * 24);
export const SESSION_MAX_AGE_SECONDS = Math.max(
  1,
  Math.floor(SESSION_TTL_MS / 1000)
);

function getSecret() {
  return process.env.AUTH_SECRET || "humpty-dumpty-secret";
}

function encodeBase64(input) {
  return Buffer.from(input, "utf8").toString("base64");
}

function decodeBase64(input) {
  return Buffer.from(input, "base64").toString("utf8");
}

function createSignature(payloadEncoded) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payloadEncoded)
    .digest("base64");
}

function safeCompareSignature(expected, provided) {
  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

export function createSessionToken(user) {
  const payload = {
    sub: user?._id?.toString() || user?.id || "",
    username: user?.username || "",
    iat: Date.now(),
  };

  const payloadEncoded = encodeBase64(JSON.stringify(payload));
  const signature = createSignature(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
}

export function parseSessionToken(token) {
  if (!token) return null;

  const [payloadEncoded, signature] = token.split(".");
  if (!payloadEncoded || !signature) return null;

  const expectedSignature = createSignature(payloadEncoded);
  if (!safeCompareSignature(expectedSignature, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64(payloadEncoded));
    return payload;
  } catch (error) {
    console.error("Failed to parse session payload", error);
    return null;
  }
}

export function validateSessionToken(token) {
  const payload = parseSessionToken(token);
  if (!payload) return null;

  if (!payload.username || !payload.iat) return null;

  const expiresAt = Number(payload.iat) + SESSION_TTL_MS;
  if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
    return null;
  }

  return payload;
}
