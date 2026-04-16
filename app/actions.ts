"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
	searchAll,
	searchTraders,
	structRewardsMarketsCacheTag,
	structTraderPositionsCacheTag,
	structTraderTradesCacheTag,
} from "@/lib/struct/queries";
import {
	structHomeTopMarketsCacheTag,
	structRecentGlobalTradesCacheTag,
} from "@/lib/struct/market-queries";

export type SearchResult = {
	traders: { address: string; name: string | null; pseudonym: string | null; profile_image: string | null }[];
	markets: { slug: string; question: string | null; image_url: string | null; volume_usd: number | null }[];
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
	const { traders, markets } = await searchAll(query);
	return {
		traders: traders.map((t) => ({
			address: t.address,
			name: t.name ?? null,
			pseudonym: t.pseudonym ?? null,
			profile_image: t.profile_image ?? null,
		})),
		markets: markets
			.filter((m) => m.market_slug)
			.map((m) => ({
				slug: m.market_slug!,
				question: m.question ?? m.title ?? null,
				image_url: m.image_url ?? null,
				volume_usd: m.volume_usd ?? null,
			})),
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

export async function refreshHomeActivityAction(kind: "markets" | "trades") {
	updateTag(kind === "markets" ? structHomeTopMarketsCacheTag : structRecentGlobalTradesCacheTag);
	revalidatePath("/");
}
