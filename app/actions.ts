"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
	searchAll,
	searchTraders,
	structRewardsMarketsCacheTag,
	structTraderPositionsCacheTag,
	structTraderTradesCacheTag,
} from "@/lib/struct/queries";

export type SearchResultMarket = {
	slug: string;
	question: string | null;
	image_url: string | null;
	volume_lifetime_usd: number | null;
	volume_24hr_usd: number | null;
	status: string | null;
	outcomes: { name: string; price: number | null }[];
};

export type SearchResultTrader = {
	address: string;
	name: string | null;
	pseudonym: string | null;
	profile_image: string | null;
	volume_usd: number | null;
};

export type SearchResult = {
	traders: SearchResultTrader[];
	markets: SearchResultMarket[];
};

export async function searchTradersAction(query: string) {
	const results = await searchTraders(query);
	return results.map((t) => ({
		address: t.address,
		name: t.name ?? null,
		pseudonym: t.pseudonym ?? null,
		profile_image: t.profile_image ?? null,
	}));
}

export async function searchAction(query: string): Promise<SearchResult> {
	const { traders, markets, events } = await searchAll(query);

	const merged = new Map<string, SearchResultMarket>();

	for (const m of markets) {
		if (!m.market_slug) continue;
		const extra = m as { volume_24hr?: number | null };
		merged.set(m.market_slug, {
			slug: m.market_slug,
			question: m.question ?? m.title ?? null,
			image_url: m.image_url ?? null,
			volume_lifetime_usd: m.metrics?.lifetime?.volume ?? m.volume_usd ?? null,
			volume_24hr_usd: extra.volume_24hr ?? m.metrics?.["24h"]?.volume ?? null,
			status: m.status ?? null,
			outcomes: (m.outcomes ?? []).map((o) => ({ name: o.name, price: o.price ?? null })),
		});
	}

	for (const event of events) {
		for (const m of event.markets) {
			if (!m.market_slug || merged.has(m.market_slug)) continue;
			merged.set(m.market_slug, {
				slug: m.market_slug,
				question: m.question ?? m.title ?? null,
				image_url: m.image_url ?? event.image_url ?? null,
				volume_lifetime_usd: m.volume ?? null,
				volume_24hr_usd: m.volume_24hr ?? null,
				status: m.status ?? null,
				outcomes: (m.outcomes ?? []).map((o) => ({ name: o.name, price: o.price ?? null })),
			});
		}
	}

	return {
		traders: traders.map((t) => ({
			address: t.address,
			name: t.name ?? null,
			pseudonym: t.pseudonym ?? null,
			profile_image: t.profile_image ?? null,
			volume_usd: t.pnl?.total_volume_usd ?? null,
		})),
		markets: Array.from(merged.values()),
	};
}

export async function refreshTraderTabAction(pathname: string, kind: "positions" | "activity") {
	if (!pathname.startsWith("/traders/")) {
		throw new Error("Invalid trader pathname");
	}

	updateTag(kind === "positions" ? structTraderPositionsCacheTag : structTraderTradesCacheTag);
	revalidatePath(pathname);
}

export async function refreshRewardsPageAction() {
	updateTag(structRewardsMarketsCacheTag);
	revalidatePath("/rewards");
}
