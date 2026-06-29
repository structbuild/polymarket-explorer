import "server-only";

import type { HomeActivityData, HomeActivityTab } from "@/lib/home-activity";
import { marketResponseToRow } from "@/lib/market-table-map";
import { getRecentTrades, getTopMarkets } from "@/lib/struct/market-queries";
import { getTopTradesMarkets } from "@/lib/struct/queries";

const HOME_MARKET_COUNT = 12;
const HOME_TRADE_COUNT = 15;

export async function loadHomeActivityData(tab: HomeActivityTab): Promise<HomeActivityData> {
	switch (tab) {
		case "trending": {
			const result = await getTopMarkets(HOME_MARKET_COUNT, "open", undefined, "volume", "desc", "24h");
			return { kind: tab, markets: result.data.map((market) => marketResponseToRow(market, { metricsTimeframes: ["24h"] })) };
		}
		case "bestTrades": {
			const result = await getTopTradesMarkets({ timeframe: "1d", limit: HOME_MARKET_COUNT });
			return { kind: tab, trades: result.data };
		}
		case "markets": {
			const result = await getTopMarkets(
				HOME_MARKET_COUNT,
				"open",
				undefined,
				"created_time",
				"desc",
				"24h",
				"Hide from New",
			);
			return { kind: tab, markets: result.data.map((market) => marketResponseToRow(market, { metricsTimeframes: ["24h"] })) };
		}
		case "trades":
		default:
			return { kind: "trades", trades: await getRecentTrades(HOME_TRADE_COUNT) };
	}
}
