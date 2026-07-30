import type { MarketResponse } from "@structbuild/sdk";

type ClobRewardField =
	| "rewards_daily_rate"
	| "total_daily_rate"
	| "native_daily_rate"
	| "sponsored_daily_rate"
	| "rewards_max_spread"
	| "rewards_min_size"
	| "sponsors_count";

export type RewardsTableRow = {
	id: string;
	slug: string | null;
	question: string;
	imageUrl: string | null;
	eventSlug: string | null;
	probability: number | null;
	volume24hUsd: number | null;
	volume24hShares: number | null;
	liquidityUsd: number | null;
	totalDailyRate: number | null;
	nativeDailyRate: number | null;
	sponsoredDailyRate: number | null;
	maxSpread: number | null;
	minSize: number | null;
	sponsorsCount: number | null;
};

function sumRewardField(market: MarketResponse, field: ClobRewardField): number | null {
	return market.clob_rewards?.map((r) => r[field]).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? null;
}

export function marketResponseToRewardsRow(market: MarketResponse): RewardsTableRow {
	return {
		id: market.condition_id,
		slug: market.market_slug ?? null,
		question: market.question ?? "",
		imageUrl: market.image_url ?? null,
		eventSlug: market.event_slug ?? null,
		probability: market.outcomes?.[0]?.price ?? null,
		volume24hUsd: market.metrics?.["24h"]?.volume ?? null,
		volume24hShares: market.metrics?.["24h"]?.shares_volume ?? null,
		liquidityUsd: market.liquidity_usd ?? null,
		totalDailyRate: sumRewardField(market, "total_daily_rate"),
		nativeDailyRate: sumRewardField(market, "native_daily_rate"),
		sponsoredDailyRate: sumRewardField(market, "sponsored_daily_rate"),
		maxSpread: sumRewardField(market, "rewards_max_spread"),
		minSize: sumRewardField(market, "rewards_min_size"),
		sponsorsCount: sumRewardField(market, "sponsors_count"),
	};
}
