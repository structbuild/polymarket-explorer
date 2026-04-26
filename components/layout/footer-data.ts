import "server-only";

import type { LeaderboardEntry, MarketResponse, Tag } from "@structbuild/sdk";
import { cacheLife, cacheTag } from "next/cache";

import { DEFAULT_MARKET_STATUS_TAB } from "@/lib/market-search-params-shared";
import { getAllTags, getGlobalLeaderboard, getTopMarkets } from "@/lib/struct/market-queries";
import { getRewardsMarkets } from "@/lib/struct/queries";
import { DEFAULT_TAG_SORT, DEFAULT_TAG_TIMEFRAME } from "@/lib/struct/tag-shared";
import { DEFAULT_TRADER_TIMEFRAME } from "@/lib/trader-timeframes";

export const FOOTER_ROW_COUNT = 5;
export const footerDataCacheTag = "footer-data";

export type FooterData = {
	topMarkets: MarketResponse[];
	topTags: Tag[];
	topTraders: LeaderboardEntry[];
	rewardsMarkets: MarketResponse[];
};

export async function getFooterData(): Promise<FooterData> {
	"use cache";
	cacheLife("minutes");
	cacheTag(footerDataCacheTag);

	const [topMarketsResult, allTags, leaderboardResult, rewardsMarkets] = await Promise.all([
		getTopMarkets(24, DEFAULT_MARKET_STATUS_TAB, undefined, "volume", "desc", "24h"),
		getAllTags(DEFAULT_TAG_SORT, DEFAULT_TAG_TIMEFRAME),
		getGlobalLeaderboard(DEFAULT_TRADER_TIMEFRAME, 100),
		getRewardsMarkets(),
	]);

	return {
		topMarkets: topMarketsResult.data.slice(0, FOOTER_ROW_COUNT),
		topTags: allTags.filter((tag): tag is Tag & { slug: string } => typeof tag.slug === "string" && tag.slug.length > 0).slice(0, FOOTER_ROW_COUNT),
		topTraders: leaderboardResult.data.slice(0, FOOTER_ROW_COUNT),
		rewardsMarkets: rewardsMarkets.slice(0, FOOTER_ROW_COUNT),
	};
}
