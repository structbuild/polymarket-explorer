import "server-only";

import {
	defaultMarketTradesPageSize,
	getMarketBySlug,
	getMarketHolders,
	getMarketHoldersHistory,
	getMarketPriceJumps,
	getMarketTradesPage,
} from "@/lib/struct/market-queries";
import { getMarketTopTraders } from "@/lib/struct/queries";
import {
	defaultMarketDetailTab,
	marketDetailTabValues,
	maxMarketTradesPageNumber,
	type MarketDetailTab,
} from "@/lib/market-detail-search-params-shared";

export type MarketTabPageParams = {
	slug: string;
	conditionId: string;
	tab: MarketDetailTab;
	search: string;
};

function parseMarketDetailTab(value: MarketDetailTab) {
	return marketDetailTabValues.includes(value) ? value : defaultMarketDetailTab;
}

function parseMarketTradesPageParam(params: URLSearchParams) {
	const pageNumber = Number.parseInt(params.get("tradesPage") ?? "", 10);
	if (!Number.isSafeInteger(pageNumber)) {
		return 1;
	}

	return Math.min(Math.max(pageNumber, 1), maxMarketTradesPageNumber);
}

export async function loadMarketTabPage({
	slug,
	conditionId,
	tab,
	search,
}: MarketTabPageParams) {
	const params = new URLSearchParams(search);
	const safeTab = parseMarketDetailTab(tab);

	switch (safeTab) {
		case "holders": {
			const data = await getMarketHolders(slug, 25);
			return {
				kind: "holders" as const,
				slug,
				conditionId,
				data,
			};
		}
		case "spikes": {
			const jumps = await getMarketPriceJumps(conditionId);
			const spikes = (jumps ?? []).slice().sort((a, b) => b.from - a.from);
			return {
				kind: "spikes" as const,
				slug,
				conditionId,
				spikes,
			};
		}
		case "holders-history": {
			const candles = await getMarketHoldersHistory(conditionId);
			const data = (candles ?? [])
				.filter((c): c is { t: number; h: number } => Number.isFinite(c.t) && Number.isFinite(c.h))
				.sort((a, b) => a.t - b.t);
			return {
				kind: "holders-history" as const,
				slug,
				conditionId,
				data,
			};
		}
		case "top-traders": {
			const [market, topTraders] = await Promise.all([
				getMarketBySlug(slug),
				getMarketTopTraders({ market_slug: slug, limit: 20 }),
			]);
			const outcomes = (market?.outcomes ?? [])
				.filter((o): o is { name: string; position_id: string } & typeof o => Boolean(o.position_id))
				.map((o) => ({ position_id: o.position_id as string, name: o.name }));
			return {
				kind: "top-traders" as const,
				slug,
				conditionId,
				outcomes,
				traders: topTraders.data,
			};
		}
		case "trades":
		default: {
			const pageNumber = parseMarketTradesPageParam(params);
			const page = await getMarketTradesPage(conditionId, {
				limit: defaultMarketTradesPageSize,
				offset: (pageNumber - 1) * defaultMarketTradesPageSize,
			});
			return {
				kind: "trades" as const,
				slug,
				conditionId,
				pageNumber,
				page,
			};
		}
	}
}
