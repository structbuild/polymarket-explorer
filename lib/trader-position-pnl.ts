export type TraderPositionPnlInput = {
	realized_pnl_usd?: number | null
	realized_pnl_pct?: number | null
	total_buy_usd?: number | null
	current_shares_balance?: number | null
	avg_entry_price?: number | null
	current_price?: number | null
}

export type TraderPositionPnlDisplay = {
	value: number
	percent: number | null
	colorValue: number
}

function readFiniteNumber(value: number | null | undefined) {
	return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function getTraderPositionPnlDisplay(
	row: TraderPositionPnlInput,
): TraderPositionPnlDisplay {
	const heldShares = readFiniteNumber(row.current_shares_balance) ?? 0
	const avgEntry = readFiniteNumber(row.avg_entry_price)
	const currentPrice = readFiniteNumber(row.current_price)

	if (heldShares > 0 && avgEntry != null && avgEntry > 0 && currentPrice != null) {
		const value = heldShares * (currentPrice - avgEntry)
		const percent = ((currentPrice - avgEntry) / avgEntry) * 100
		return { value, percent, colorValue: value }
	}

	const realized = readFiniteNumber(row.realized_pnl_usd) ?? 0
	const realizedPct = readFiniteNumber(row.realized_pnl_pct)
	const totalBuyUsd = readFiniteNumber(row.total_buy_usd)
	const rawPercent =
		realizedPct ??
		(totalBuyUsd != null && totalBuyUsd > 0 ? (realized / totalBuyUsd) * 100 : null)
	const percent = rawPercent != null ? Math.max(rawPercent, -100) : null

	return { value: realized, percent, colorValue: realized }
}
