import type {
	MarketResponse,
	MetricsTimeframe,
	SimpleTimeframeMetrics,
} from "@structbuild/sdk";

export type TimeframeMetrics = Partial<Record<MetricsTimeframe, SimpleTimeframeMetrics>>;

export type MarketTableRow = {
	id: string;
	slug: string | null;
	question: string | null;
	title: string | null;
	imageUrl: string | null;
	outcomes: { label: string; probability: number | null }[];
	volumeUsd: number | null;
	liquidityUsd: number | null;
	status: string;
	endTime: number | null;
	category: string | null;
	eventSlug: string | null;
	totalHolders: number | null;
	highestProbability: number | null;
	isNegRisk: boolean;
	metrics: TimeframeMetrics;
};

export function marketResponseToRow(market: MarketResponse): MarketTableRow {
	return {
		id: market.condition_id,
		slug: market.market_slug ?? null,
		question: market.question ?? null,
		title: market.title ?? null,
		imageUrl: market.image_url ?? null,
		outcomes:
			market.outcomes?.map((o) => ({
				label: o.name,
				probability: o.price,
			})) ?? [],
		volumeUsd: market.volume_usd ?? null,
		liquidityUsd: market.liquidity_usd ?? null,
		status: market.status,
		endTime: market.end_time ?? null,
		category: market.category ?? null,
		eventSlug: market.event_slug ?? null,
		totalHolders: market.total_holders ?? null,
		highestProbability: market.highest_probability ?? null,
		isNegRisk: market.is_neg_risk ?? false,
		metrics: market.metrics ?? {},
	};
}

