export const TRADER_LEADERBOARD_SORT_KEYS = [
	"total_pnl_usd",
	"realized_pnl_usd",
	"unrealized_pnl_usd",
	"usd_balance",
	"open_positions_value",
	"open_position_count",
	"total_volume_usd",
	"buy_volume_usd",
	"sell_volume_usd",
	"redemption_volume_usd",
	"merge_volume_usd",
	"total_fees",
	"total_buys",
	"total_sells",
	"total_redemptions",
	"total_merges",
	"events_traded",
	"markets_traded",
	"markets_won",
	"markets_lost",
	"market_win_rate_pct",
	"avg_win_usd",
	"avg_loss_usd",
	"profit_factor",
	"total_wins_usd",
	"total_losses_usd",
	"best_win",
	"worst_loss",
	"avg_hold_time_seconds",
	"first_trade_at",
	"last_trade_at",
	"maker_rebate_count",
	"maker_rebate_usd",
	"reward_count",
	"reward_usd",
	"yield_count",
	"yield_usd",
] as const;

export type TraderLeaderboardSortKey = (typeof TRADER_LEADERBOARD_SORT_KEYS)[number];

export const TRADER_LEADERBOARD_SORT_DIRECTIONS = ["asc", "desc"] as const;
export type TraderLeaderboardSortDirection = (typeof TRADER_LEADERBOARD_SORT_DIRECTIONS)[number];

export const DEFAULT_TRADER_LEADERBOARD_SORT: TraderLeaderboardSortKey = "total_pnl_usd";
export const DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION: TraderLeaderboardSortDirection = "desc";

export type LeaderboardScope = "global" | "category";

const CATEGORY_SORT_OVERRIDES: Partial<Record<TraderLeaderboardSortKey, string>> = {
	total_redemptions: "redeem_count",
	total_merges: "merge_count",
};

const CATEGORY_UNSUPPORTED_SORTS = new Set<TraderLeaderboardSortKey>([
	"usd_balance",
	"events_traded",
	"open_positions_value",
	"open_position_count",
	"maker_rebate_count",
	"maker_rebate_usd",
	"reward_count",
	"reward_usd",
	"yield_count",
	"yield_usd",
]);

export function isLeaderboardSortSupported(
	sortKey: TraderLeaderboardSortKey,
	scope: LeaderboardScope,
): boolean {
	if (scope === "category" && CATEGORY_UNSUPPORTED_SORTS.has(sortKey)) return false;
	return true;
}

export function parseTraderLeaderboardSort(
	value: string | string[] | undefined,
	scope: LeaderboardScope,
): TraderLeaderboardSortKey {
	const raw = Array.isArray(value) ? value[0] : value;
	if (raw === "unrealized_pnl") {
		return scope === "global" ? "open_positions_value" : DEFAULT_TRADER_LEADERBOARD_SORT;
	}
	if (raw && (TRADER_LEADERBOARD_SORT_KEYS as readonly string[]).includes(raw)) {
		const key = raw as TraderLeaderboardSortKey;
		if (isLeaderboardSortSupported(key, scope)) return key;
	}
	return DEFAULT_TRADER_LEADERBOARD_SORT;
}

export function parseTraderLeaderboardSortDirection(
	value: string | string[] | undefined,
): TraderLeaderboardSortDirection {
	const raw = Array.isArray(value) ? value[0] : value;
	if (raw === "asc" || raw === "desc") return raw;
	return DEFAULT_TRADER_LEADERBOARD_SORT_DIRECTION;
}

const SORT_LABELS: Record<TraderLeaderboardSortKey, string> = {
	total_pnl_usd: "total profit",
	realized_pnl_usd: "realized profit",
	unrealized_pnl_usd: "unrealized profit",
	usd_balance: "wallet balance",
	open_positions_value: "open positions value",
	open_position_count: "open positions",
	total_volume_usd: "volume",
	buy_volume_usd: "buy volume",
	sell_volume_usd: "sell volume",
	redemption_volume_usd: "redemption volume",
	merge_volume_usd: "merge volume",
	total_fees: "fees paid",
	total_buys: "number of buys",
	total_sells: "number of sells",
	total_redemptions: "number of redemptions",
	total_merges: "number of merges",
	events_traded: "events traded",
	markets_traded: "markets traded",
	markets_won: "markets won",
	markets_lost: "markets lost",
	market_win_rate_pct: "win rate",
	avg_win_usd: "average win",
	avg_loss_usd: "average loss",
	profit_factor: "profit factor",
	total_wins_usd: "total wins",
	total_losses_usd: "total losses",
	best_win: "best winning trade",
	worst_loss: "worst losing trade",
	avg_hold_time_seconds: "average hold time",
	first_trade_at: "first trade time",
	last_trade_at: "last trade time",
	maker_rebate_count: "maker rebate count",
	maker_rebate_usd: "maker rebates",
	reward_count: "reward count",
	reward_usd: "rewards earned",
	yield_count: "yield count",
	yield_usd: "yield earned",
};

export function getLeaderboardSortLabel(sort: TraderLeaderboardSortKey): string {
	return SORT_LABELS[sort];
}

export function resolveLeaderboardSortField(
	sort: TraderLeaderboardSortKey,
	scope: LeaderboardScope,
): string | undefined {
	if (sort === "best_win") return "best_trade_pnl_usd";
	if (sort === "worst_loss") return "worst_trade_pnl_usd";
	if (scope === "category" && CATEGORY_SORT_OVERRIDES[sort]) {
		return CATEGORY_SORT_OVERRIDES[sort] as string;
	}
	return sort;
}
