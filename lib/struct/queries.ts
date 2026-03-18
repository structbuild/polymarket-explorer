import "server-only";

import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import {
  normalizeMarketCollection,
  normalizeMarketEntity,
} from "@/lib/struct/normalize";
import type { MarketDetail, MarketSummary } from "@/lib/struct/types";

const featuredLimit = 12;

function readStatus(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const record = error as Record<string, unknown>;
  const status = record.status;

  return typeof status === "number" ? status : null;
}

function logStructError(label: string, error: unknown) {
  console.error(`Struct SDK request failed: ${label}`, error);
}

export const getFeaturedMarkets = cache(async (): Promise<MarketSummary[]> => {
  const client = getStructClient();

  if (!client) {
    return [];
  }

  try {
    const response = await client.markets.getMarkets({ limit: featuredLimit });
    return normalizeMarketCollection(response).slice(0, featuredLimit);
  } catch (error) {
    logStructError("getFeaturedMarkets", error);
    return [];
  }
});

export const getMarketBySlug = cache(
  async (slug: string): Promise<MarketDetail | null> => {
    const client = getStructClient();

    if (!client || !slug.trim()) {
      return null;
    }

    try {
      const response = await client.markets.getMarketBySlug({ slug });
      return normalizeMarketEntity(response);
    } catch (error) {
      if (readStatus(error) === 404) {
        return null;
      }

      logStructError(`getMarketBySlug:${slug}`, error);
      throw error;
    }
  },
);
