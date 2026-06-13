export const traderTabValues = ["active", "closed", "activity", "categories", "markets"] as const;
export const maxTraderPageNumber = 1000;
export type TraderTab = (typeof traderTabValues)[number];

export const traderExitModeValues = ["wins", "losses"] as const;
export type TraderExitMode = (typeof traderExitModeValues)[number];

export const traderPositionSortByValues = [
	"title",
	"avg_entry_price",
	"avg_exit_price",
	"realized_pnl_usd",
	"total_pnl_usd",
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
	"total_pnl_pct",
	"current_shares_balance",
	"end_date",
	"redeemable",
	"mergeable",
	"merge_count",
	"split_count",
	"is_neg_risk",
] as const;
export type TraderPositionSortBy = (typeof traderPositionSortByValues)[number];

export const traderCategorySortByValues = [
	"total_pnl_usd",
	"realized_pnl_usd",
	"unrealized_pnl_usd",
	"total_volume_usd",
	"buy_volume_usd",
	"sell_volume_usd",
	"redemption_volume_usd",
	"merge_volume_usd",
	"split_volume_usd",
	"total_fees",
	"total_shares_bought",
	"markets_traded",
	"markets_resolved",
	"markets_won",
	"markets_lost",
	"market_win_rate_pct",
	"avg_win_usd",
	"avg_loss_usd",
	"profit_factor",
	"total_wins_usd",
	"total_losses_usd",
	"best_trade_pnl_usd",
	"worst_trade_pnl_usd",
	"avg_hold_time_seconds",
	"outcomes_traded",
	"first_trade_at",
	"last_trade_at",
] as const;
export type TraderCategorySortBy = (typeof traderCategorySortByValues)[number];

export const traderMarketSortByValues = [
	"total_pnl_usd",
	"realized_pnl_usd",
	"unrealized_pnl_usd",
	"total_volume_usd",
	"buy_volume_usd",
	"sell_volume_usd",
	"redemption_volume_usd",
	"merge_volume_usd",
	"split_volume_usd",
	"total_fees",
	"total_shares_bought",
	"total_shares_sold",
	"outcomes_traded",
	"first_trade_at",
	"last_trade_at",
] as const;
export type TraderMarketSortBy = (typeof traderMarketSortByValues)[number];

export const defaultTraderCategorySortBy: TraderCategorySortBy = "total_volume_usd";
export const defaultTraderMarketSortBy: TraderMarketSortBy = "total_volume_usd";

export const traderSortDirectionValues = ["asc", "desc"] as const;
export type TraderSortDirection = (typeof traderSortDirectionValues)[number];

export const defaultTraderPositionSortBy = {
	open: "last_trade_at",
	closed: "last_trade_at",
} as const satisfies Record<"open" | "closed", TraderPositionSortBy>;

export const rankedPositionSortBy: TraderPositionSortBy = "total_pnl_usd";

export const rankedPositionSortDirection = {
	wins: "desc",
	losses: "asc",
} as const satisfies Record<TraderExitMode, TraderSortDirection>;

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
		if (!/^\d+$/.test(value)) return null;
		const parsed = Number.parseInt(value, 10);
		if (!Number.isSafeInteger(parsed)) return null;
		if (parsed < MIN_PNL_UNIX_SECONDS || parsed > MAX_PNL_UNIX_SECONDS) return null;
		return parsed;
	},
	serialize(value: number) {
		return String(value);
	},
};
