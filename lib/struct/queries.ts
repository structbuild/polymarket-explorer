import "server-only";

import type { GlobalPnlTrader, MarketMetadata, Trader } from "@structbuild/sdk";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import type { MarketDetail, MarketSummary } from "@/lib/struct/types";

const featuredLimit = 12;

function toMarket(m: MarketMetadata): MarketSummary {
  return {
    id: m.condition_id,
    slug: m.slug,
    title: m.question,
    description: m.description ?? null,
    probability: m.outcomes[0]?.price != null
      ? Math.round(m.outcomes[0].price * 1000) / 10
      : null,
    volume: m.volume_usd ?? null,
    endDate: m.end_time != null
      ? new Date(m.end_time * 1000).toISOString()
      : null,
    eventTitle: m.event_title ?? null,
    conditionId: m.condition_id,
    outcomes: m.outcomes.map((o) => ({
      label: o.name,
      probability: o.price != null ? Math.round(o.price * 1000) / 10 : null,
    })),
  };
}

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
    return response.data.map(toMarket);
  } catch (error) {
    logStructError("getFeaturedMarkets", error);
    return [];
  }
});

export const getLeaderboard = cache(async (): Promise<GlobalPnlTrader[]> => {
  const client = getStructClient();

  if (!client) {
    return [];
  }

  try {
    const response = await client.trader.getGlobalPnl({
      timeframe: "1d",
      sort_by: "pnl_usd",
      sort_direction: "desc",
      limit: 25,
    });
    const isAddress = (v?: string | null) => v != null && /^0x[0-9a-fA-F]{6,}/.test(v);
    return response.data.filter((entry) => {
      const name = entry.trader.name ?? entry.trader.pseudonym;
      return name && !isAddress(name);
    });
  } catch (error) {
    logStructError("getLeaderboard", error);
    return [];
  }
});

export const searchTraders = cache(async (query: string): Promise<Trader[]> => {
  const client = getStructClient();

  if (!client || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await client.search.search({
      q: query.trim(),
      limit: 25,
    });
    return response.data.traders;
  } catch (error) {
    logStructError(`searchTraders:${query}`, error);
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
      return toMarket(response.data);
    } catch (error) {
      if (readStatus(error) === 404) {
        return null;
      }

      logStructError(`getMarketBySlug:${slug}`, error);
      throw error;
    }
  },
);
