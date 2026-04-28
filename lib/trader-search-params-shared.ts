export const traderTabValues = ["active", "closed", "activity"] as const;
export const maxTraderPageNumber = 1000;
export type TraderTab = (typeof traderTabValues)[number];

export const traderPositionSortByValues = [
	"title",
	"avg_entry_price",
	"avg_exit_price",
	"realized_pnl_usd",
	"current_value",
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
] as const;
export type TraderPositionSortBy = (typeof traderPositionSortByValues)[number];

export const traderSortDirectionValues = ["asc", "desc"] as const;
export type TraderSortDirection = (typeof traderSortDirectionValues)[number];

export const defaultTraderPositionSortBy = {
	open: "last_trade_at",
	closed: "last_trade_at",
} as const satisfies Record<"open" | "closed", TraderPositionSortBy>;

export { pnlTimeframeValues, type PnlTimeframe } from "@/lib/polymarket/pnl-timeframes";

export const positivePageParserDef = {
	parse(value: string) {
		const parsed = Number.parseInt(value, 10);
		return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maxTraderPageNumber) : null;
	},
	serialize(value: number) {
		return String(value);
	},
};
