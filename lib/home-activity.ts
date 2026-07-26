import type { MarketPnl, Trade } from "@structbuild/sdk";

import type { MarketTableRow } from "@/lib/market-table-map";

export const HOME_ACTIVITY_TABS = ["trades", "trending", "bestTrades", "markets"] as const;

export type HomeActivityTab = (typeof HOME_ACTIVITY_TABS)[number];

export type HomeActivityData =
	| { kind: "trades"; trades: Trade[] }
	| { kind: "trending"; markets: MarketTableRow[] }
	| { kind: "bestTrades"; trades: MarketPnl[] }
	| { kind: "markets"; markets: MarketTableRow[] };
