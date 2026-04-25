import "server-only";

import type {
	PositionChartOutcome,
	PositionVolumeDataPoint,
	PriceJump,
} from "@structbuild/sdk";
import { cacheLife, cacheTag } from "next/cache";

import { getStructClient } from "@/lib/struct/client";
import { logStructError, readStatus } from "@/lib/struct/http";

export const structMarketChartCacheTag = "struct-market-chart-v2";
export const structPositionVolumeChartCacheTag = "struct-position-volume-chart-v2";
export const structMarketPriceJumpsCacheTag = "struct-market-price-jumps-v2";

export async function getMarketChart(conditionId: string): Promise<PositionChartOutcome[] | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketChartCacheTag);

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
}

export async function getPositionVolumeChart(positionId: string): Promise<PositionVolumeDataPoint[] | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structPositionVolumeChartCacheTag);

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
}

export async function getMarketPriceJumps(conditionId: string): Promise<PriceJump[] | null> {
	"use cache";
	cacheLife("minutes");
	cacheTag(structMarketPriceJumpsCacheTag);

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
}
