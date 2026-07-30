import type { EventMarket, EventMarketOutcome } from "@structbuild/sdk";

import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";

const RESOLVED_STATUSES = new Set(["closed", "resolved"]);

export type EventMarketRow = {
	conditionId: string;
	id: string | null;
	slug: string;
	title: string;
	imageUrl: string | null;
	isResolved: boolean;
	resolvedOutcomeName: string | null;
	yesPrice: number | null;
	volume24hr: number | null;
	liquidityUsd: number | null;
	endTime: number | null;
};

function isMarketResolved(market: EventMarket): boolean {
	return (
		RESOLVED_STATUSES.has(market.status?.toLowerCase() ?? "") ||
		market.winning_outcome != null
	);
}

function getLeadingOutcome(market: EventMarket): EventMarketOutcome | null {
	const outcomes = market.outcomes ?? [];
	if (outcomes.length === 0) return null;
	let best = outcomes[0];
	for (const o of outcomes) {
		if ((o.price ?? 0) > (best.price ?? 0)) best = o;
	}
	return best;
}

function getResolvedOutcome(market: EventMarket): EventMarketOutcome | null {
	if (market.winning_outcome) return market.winning_outcome;
	const outcomes = market.outcomes ?? [];
	const top = outcomes.find((o) => (o.price ?? 0) >= 0.99);
	if (top) return top;
	return getLeadingOutcome(market);
}

function getMarketDisplayTitle(market: EventMarket): string {
	const title = market.title?.trim();
	if (title) return title;
	const question = market.question?.trim();
	if (question) return question;
	return market.market_slug || "Untitled market";
}

export function eventMarketToRow(market: EventMarket): EventMarketRow {
	const resolved = isMarketResolved(market);
	return {
		conditionId: market.condition_id,
		id: market.id ?? null,
		slug: market.market_slug,
		title: getMarketDisplayTitle(market),
		imageUrl: normalizePolymarketS3ImageUrl(market.image_url) ?? null,
		isResolved: resolved,
		resolvedOutcomeName: resolved ? (getResolvedOutcome(market)?.name ?? null) : null,
		yesPrice: market.outcomes?.[0]?.price ?? null,
		volume24hr: market.volume_24hr ?? null,
		liquidityUsd: market.liquidity_usd ?? null,
		endTime: market.end_time ?? null,
	};
}
