const defaultSiteUrl = "http://localhost:3000";
const defaultTimeoutMs = 10_000;

function readString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

export function getSitePasswordGate() {
  const password = readString(process.env.SITE_PASSWORD);
  const enabled = readBoolean(process.env.SITE_PASSWORD_ENABLED) && password !== null;
  return { enabled, password };
}

export function hasStructConfig() {
  return Boolean(readString(process.env.STRUCTBUILD_API_KEY));
}

export function getStructConfig() {
  return {
    apiKey: readString(process.env.STRUCTBUILD_API_KEY),
    timeoutMs: readPositiveInteger(
      process.env.STRUCTBUILD_TIMEOUT_MS,
      defaultTimeoutMs,
    ),
  };
}

export function getSiteUrl() {
  const configured =
    readString(process.env.NEXT_PUBLIC_SITE_URL) ??
    readString(process.env.SITE_URL) ??
    readString(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    readString(process.env.VERCEL_URL);

  const normalized =
    configured && !/^https?:\/\//i.test(configured)
      ? `https://${configured}`
      : configured;

  try {
    return new URL(normalized ?? defaultSiteUrl);
  } catch {
    return new URL(defaultSiteUrl);
  }
}

const defaultAuthBaseUrl = "https://struct.to";

function isAllowedAuthUrl(url: URL): boolean {
  const isLocal = url.hostname === "localhost" || url.hostname.endsWith(".localhost");
  const isStruct = url.hostname === "struct.to" || url.hostname.endsWith(".struct.to");
  if (isLocal) return url.protocol === "http:" || url.protocol === "https:";
  if (isStruct) return url.protocol === "https:";
  return false;
}

export function getAuthBaseUrl() {
  const configured = readString(process.env.NEXT_PUBLIC_AUTH_URL);
  if (configured) {
    try {
      if (isAllowedAuthUrl(new URL(configured))) return configured;
    } catch {
      return defaultAuthBaseUrl;
    }
  }
  return defaultAuthBaseUrl;
}
