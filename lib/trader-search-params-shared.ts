export const traderTabValues = ["active", "closed", "activity", "wins", "losses"] as const;
export const maxTraderPageNumber = 1000;
export type TraderTab = (typeof traderTabValues)[number];

export type TraderExitMode = "wins" | "losses";

export function exitModeForTab(tab: TraderTab): TraderExitMode | null {
	if (tab === "wins") return "wins";
	if (tab === "losses") return "losses";
	return null;
}

export const traderPositionSortByValues = [
	"title",
	"avg_entry_price",
	"avg_exit_price",
	"realized_pnl_usd",
	"current_value",
	"current_price",
	"total_shares_bought",
	"total_shares_sold",
	"total_buy_usd",
	"total_sell_usd",
	"total_fees",
	"redemption_usd",
	"total_buys",
	"total_sells",
	"first_trade_at",
	"last_trade_at",
	"realized_pnl_pct",
	"current_shares_balance",
	"end_date",
	"redeemable",
	"mergeable",
	"merge_count",
	"split_count",
	"is_neg_risk",
] as const;
export type TraderPositionSortBy = (typeof traderPositionSortByValues)[number];

export const traderSortDirectionValues = ["asc", "desc"] as const;
export type TraderSortDirection = (typeof traderSortDirectionValues)[number];

export const defaultTraderPositionSortBy = {
	open: "last_trade_at",
	closed: "last_trade_at",
} as const satisfies Record<"open" | "closed", TraderPositionSortBy>;

export { pnlTimeframeValues, pnlAnchorValues, type PnlTimeframe, type PnlAnchor } from "@/lib/struct/pnl-timeframes";

export const positivePageParserDef = {
	parse(value: string) {
		const parsed = Number.parseInt(value, 10);
		return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maxTraderPageNumber) : null;
	},
	serialize(value: number) {
		return String(value);
	},
};

const MIN_PNL_UNIX_SECONDS = 1577836800;
const MAX_PNL_UNIX_SECONDS = 4102444800;

export const unixSecondsParserDef = {
	parse(value: string) {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isSafeInteger(parsed)) return null;
		if (parsed < MIN_PNL_UNIX_SECONDS || parsed > MAX_PNL_UNIX_SECONDS) return null;
		return parsed;
	},
	serialize(value: number) {
		return String(value);
	},
};

