import "server-only";

import { StructClient } from "@structbuild/sdk";

import { getStructConfig, hasStructConfig } from "@/lib/env";

let client: StructClient | null | undefined;

export function getStructClient() {
  if (client !== undefined) {
    return client;
  }

  if (!hasStructConfig()) {
    client = null;
    return client;
  }

  const config = getStructConfig();

  client = new StructClient({
    apiKey: config.apiKey!,
    baseUrl: "https://staging-api.struct.to/v1",
    timeout: config.timeoutMs,
    retry: {
      maxRetries: 3,
      initialDelayMs: 500,
    },
  });

  return client;
}
