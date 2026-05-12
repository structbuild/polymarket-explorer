import type { Event, MetricsTimeframe, SimpleTimeframeMetrics } from "@structbuild/sdk";

import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";

export type EventTimeframeMetrics = Partial<Record<MetricsTimeframe, SimpleTimeframeMetrics>>;

export type EventTableRow = {
	id: string;
	slug: string | null;
	title: string | null;
	imageUrl: string | null;
	category: string | null;
	marketCount: number;
	endTime: number | null;
	startTime: number | null;
	createdTime: number | null;
	status: string | null;
	tags: string[];
	liquidityUsd: number | null;
	metrics: EventTimeframeMetrics;
};

function sumChildLiquidity(event: Event): number | null {
	const markets = event.markets;
	if (!markets || markets.length === 0) return null;
	let total = 0;
	let any = false;
	for (const m of markets) {
		if (m.liquidity_usd != null) {
			total += m.liquidity_usd;
			any = true;
		}
	}
	return any ? total : null;
}

export function eventResponseToRow(event: Event): EventTableRow {
	return {
		id: event.id,
		slug: event.event_slug ?? null,
		title: event.title ?? null,
		imageUrl: normalizePolymarketS3ImageUrl(event.image_url) ?? null,
		category: event.category ?? null,
		marketCount: event.market_count ?? (event.markets?.length ?? 0),
		endTime: event.end_time ?? null,
		startTime: event.start_time ?? null,
		createdTime: event.created_time ?? null,
		status: event.status ?? null,
		tags: (event.tags ?? []).map((t) => t.label).filter((l): l is string => typeof l === "string" && l.length > 0),
		liquidityUsd: sumChildLiquidity(event),
		metrics: event.metrics ?? {},
	};
}
