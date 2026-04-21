import "server-only";

import type {
	PositionChartOutcome,
	PositionVolumeDataPoint,
	PriceJump,
} from "@structbuild/sdk";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";
import { shortRevalidateSeconds } from "@/lib/struct/queries/_shared";

const structMarketCacheVersion = "v2";
export const structMarketChartCacheTag = `struct-market-chart-${structMarketCacheVersion}`;
export const structPositionVolumeChartCacheTag = `struct-position-volume-chart-${structMarketCacheVersion}`;
export const structMarketPriceJumpsCacheTag = `struct-market-price-jumps-${structMarketCacheVersion}`;

export const getMarketChart = cache(
	unstable_cache(
		async (conditionId: string): Promise<PositionChartOutcome[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getMarketChart({ condition_id: conditionId, resolution: "ALL" });
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketChart:${conditionId}`, error);
				return null;
			}
		},
		[structMarketChartCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketChartCacheTag] },
	),
);

export const getPositionVolumeChart = cache(
	unstable_cache(
		async (positionId: string): Promise<PositionVolumeDataPoint[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getPositionVolumeChart({ position_id: positionId, resolution: "60" });
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getPositionVolumeChart:${positionId}`, error);
				return null;
			}
		},
		[structPositionVolumeChartCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structPositionVolumeChartCacheTag] },
	),
);

export const getMarketPriceJumps = cache(
	unstable_cache(
		async (conditionId: string): Promise<PriceJump[] | null> => {
			const client = getStructClient();

			if (!client) {
				return null;
			}

			try {
				const response = await client.markets.getPriceJumps({
					condition_id: conditionId,
					resolution: "5",
					min_change_pct: 10,
					lookback: 1440,
				});
				return response.data;
			} catch (error) {
				if (readStatus(error) === 404) {
					return null;
				}

				logStructError(`getMarketPriceJumps:${conditionId}`, error);
				return null;
			}
		},
		[structMarketPriceJumpsCacheTag],
		{ revalidate: shortRevalidateSeconds, tags: [structMarketPriceJumpsCacheTag] },
	),
);
