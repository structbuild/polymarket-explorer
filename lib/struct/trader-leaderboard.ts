import type { CategoryEntry, GlobalEntry, GlobalPnlTrader, TraderInfo } from "@structbuild/sdk";

type NullableValues<T> = { [K in keyof T]: T[K] | null };
type GlobalLeaderboardFields = NullableValues<Omit<GlobalEntry, "trader">>;
type CategoryLeaderboardFields = NullableValues<Omit<CategoryEntry, "category" | "trader">>;

export type TraderLeaderboardEntry = Partial<GlobalLeaderboardFields> &
	Partial<CategoryLeaderboardFields> & {
		trader: TraderInfo;
		realized_pnl_usd: number;
		open_positions_value?: number;
		open_position_count?: number;
		total_buys: number;
		total_sells: number;
		total_redemptions: number;
		total_merges: number;
		total_trades: number;
	};

export type TraderLeaderboardApiEntry = (GlobalEntry | GlobalPnlTrader | CategoryEntry) & {
	trader?: TraderInfo | null;
	buy_count?: number | null;
	sell_count?: number | null;
	redeem_count?: number | null;
	merge_count?: number | null;
	total_buys?: number | null;
	total_sells?: number | null;
	total_redemptions?: number | null;
	total_merges?: number | null;
	open_positions_value?: number | null;
	open_position_count?: number | null;
};

function numberOrZero(value: number | null | undefined): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function countOrAlias(
	totalValue: number | null | undefined,
	aliasValue: number | null | undefined,
): number {
	return numberOrZero(aliasValue ?? totalValue);
}

function hasCategoryCountAliases(entry: TraderLeaderboardApiEntry): boolean {
	return (
		entry.buy_count != null
		|| entry.sell_count != null
		|| entry.redeem_count != null
		|| entry.merge_count != null
	);
}

function hasUnavailableCategoryVolume(
	entry: TraderLeaderboardApiEntry,
	totalTrades: number,
): boolean {
	if (!hasCategoryCountAliases(entry) || totalTrades <= 0) {
		return false;
	}

	return (
		numberOrZero(entry.total_volume_usd) === 0
		&& numberOrZero(entry.buy_volume_usd) === 0
		&& numberOrZero(entry.sell_volume_usd) === 0
		&& numberOrZero(entry.redemption_volume_usd) === 0
		&& numberOrZero(entry.merge_volume_usd) === 0
	);
}

export function normalizeTraderLeaderboardEntry(
	entry: TraderLeaderboardApiEntry,
): TraderLeaderboardEntry | null {
	if (!entry.trader?.address) {
		return null;
	}

	const totalBuys = countOrAlias(entry.total_buys, entry.buy_count);
	const totalSells = countOrAlias(entry.total_sells, entry.sell_count);
	const totalRedemptions = countOrAlias(entry.total_redemptions, entry.redeem_count);
	const totalMerges = countOrAlias(entry.total_merges, entry.merge_count);
	const totalTrades = totalBuys + totalSells + totalRedemptions + totalMerges;
	const volumeUnavailable = hasUnavailableCategoryVolume(entry, totalTrades);

	return {
		...entry,
		trader: entry.trader,
		buy_count: entry.buy_count ?? undefined,
		sell_count: entry.sell_count ?? undefined,
		redeem_count: entry.redeem_count ?? undefined,
		merge_count: entry.merge_count ?? undefined,
		realized_pnl_usd: numberOrZero(entry.realized_pnl_usd),
		open_positions_value: entry.open_positions_value ?? undefined,
		open_position_count: entry.open_position_count ?? undefined,
		total_buys: totalBuys,
		total_sells: totalSells,
		total_redemptions: totalRedemptions,
		total_merges: totalMerges,
		total_volume_usd: volumeUnavailable ? undefined : (entry.total_volume_usd ?? undefined),
		buy_volume_usd: volumeUnavailable ? undefined : (entry.buy_volume_usd ?? undefined),
		sell_volume_usd: volumeUnavailable ? undefined : (entry.sell_volume_usd ?? undefined),
		redemption_volume_usd: volumeUnavailable ? undefined : (entry.redemption_volume_usd ?? undefined),
		merge_volume_usd: volumeUnavailable ? undefined : (entry.merge_volume_usd ?? undefined),
		total_trades: totalTrades,
	};
}
