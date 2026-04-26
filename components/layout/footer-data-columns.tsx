import type { Route } from "next";

import { FooterColumn, FooterColumnLink } from "@/components/layout/footer-column";
import { formatCapitalizeWords } from "@/lib/format";
import { DEFAULT_MARKET_STATUS_TAB } from "@/lib/market-search-params-shared";
import {
	getAllTags,
	getGlobalLeaderboard,
	getTopMarkets,
} from "@/lib/struct/market-queries";
import { getRewardsMarkets } from "@/lib/struct/queries";
import { DEFAULT_TAG_SORT, DEFAULT_TAG_TIMEFRAME } from "@/lib/struct/tag-shared";
import { DEFAULT_TRADER_TIMEFRAME } from "@/lib/trader-timeframes";
import { normalizeWalletAddress, truncateAddress } from "@/lib/utils";

const FOOTER_ROW_COUNT = 5;

export async function FooterTopMarkets() {
	const { data } = await getTopMarkets(24, DEFAULT_MARKET_STATUS_TAB, undefined, "volume", "desc", "24h");
	const items = data.slice(0, FOOTER_ROW_COUNT);

	return (
		<FooterColumn title="Top Markets" viewAllHref={"/markets" as Route}>
			{items.map((market) => (
				<FooterColumnLink
					key={market.market_slug ?? market.condition_id}
					href={market.market_slug ? (`/markets/${market.market_slug}` as Route) : "/markets"}
					title={market.question ?? undefined}
				>
					{market.question ?? "Untitled market"}
				</FooterColumnLink>
			))}
		</FooterColumn>
	);
}

export async function FooterTopTags() {
	const tags = await getAllTags(DEFAULT_TAG_SORT, DEFAULT_TAG_TIMEFRAME);
	const items = tags.filter((tag) => typeof tag.slug === "string" && tag.slug.length > 0).slice(0, FOOTER_ROW_COUNT);

	return (
		<FooterColumn title="Top Categories" viewAllHref={"/tags" as Route}>
			{items.map((tag) => (
				<FooterColumnLink key={tag.slug} href={`/tags/${tag.slug}` as Route} title={tag.label}>
					{formatCapitalizeWords(tag.label)}
				</FooterColumnLink>
			))}
		</FooterColumn>
	);
}

export async function FooterTopTraders() {
	const { data } = await getGlobalLeaderboard(DEFAULT_TRADER_TIMEFRAME, 100);
	const items = data.slice(0, FOOTER_ROW_COUNT);

	return (
		<FooterColumn title="Top Traders" viewAllHref={"/traders" as Route}>
			{items.map((entry) => {
				const address = normalizeWalletAddress(entry.trader.address) ?? entry.trader.address;
				const name = entry.trader.name?.trim();
				const isAddressLike = name ? /^0x[0-9a-fA-F]{40}\b/.test(name) : false;
				const displayName = name && !isAddressLike ? name : truncateAddress(entry.trader.address);
				return (
					<FooterColumnLink key={entry.trader.address} href={`/traders/${address}` as Route} title={displayName}>
						{displayName}
					</FooterColumnLink>
				);
			})}
		</FooterColumn>
	);
}

export async function FooterTopRewards() {
	const markets = await getRewardsMarkets();
	const items = markets.slice(0, FOOTER_ROW_COUNT);

	return (
		<FooterColumn title="Rewards Markets" viewAllHref={"/rewards" as Route}>
			{items.map((market) => (
				<FooterColumnLink
					key={market.market_slug ?? market.condition_id}
					href={market.market_slug ? (`/markets/${market.market_slug}` as Route) : "/rewards"}
					title={market.question ?? undefined}
				>
					{market.question ?? "Untitled market"}
				</FooterColumnLink>
			))}
		</FooterColumn>
	);
}
