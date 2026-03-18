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
  const configured = readString(process.env.NEXT_PUBLIC_SITE_URL);

  try {
    return new URL(configured ?? defaultSiteUrl);
  } catch {
    return new URL(defaultSiteUrl);
  }
}

