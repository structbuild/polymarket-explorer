import type { MarketResponse } from "@structbuild/sdk";

import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";

export type RelatedMarketItem = {
	conditionId: string;
	slug: string;
	question: string;
	imageUrl: string | null;
	leadingOutcome: string | null;
	probability: string | null;
	volumeUsd: number;
	sharesVolume: number | null;
};

export function toRelatedMarketItem(market: MarketResponse, currentSlug?: string): RelatedMarketItem | null {
	const slug = market.market_slug;
	if (!slug || slug === currentSlug) return null;

	const question = market.question ?? market.title ?? "Untitled market";
	const outcomes = market.outcomes ?? [];
	const leading = outcomes.reduce<(typeof outcomes)[number] | null>(
		(best, outcome) => (best == null || (outcome.price ?? 0) > (best.price ?? 0) ? outcome : best),
		null,
	);
	const probability = leading?.price != null ? `${(leading.price * 100).toFixed(0)}%` : null;

	return {
		conditionId: market.condition_id,
		slug,
		question,
		imageUrl: normalizePolymarketS3ImageUrl(market.image_url) ?? null,
		leadingOutcome: leading?.name ?? null,
		probability,
		volumeUsd: market.metrics?.lifetime?.volume ?? market.volume_usd ?? 0,
		sharesVolume: market.metrics?.lifetime?.shares_volume ?? null,
	};
}

export function toRelatedMarketItems(markets: MarketResponse[], currentSlug: string, limit = 6): RelatedMarketItem[] {
	const items: RelatedMarketItem[] = [];
	for (const market of markets) {
		const item = toRelatedMarketItem(market, currentSlug);
		if (!item) continue;
		items.push(item);
		if (items.length >= limit) break;
	}
	return items;
}
