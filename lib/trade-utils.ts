export function normalizeTradeField(value: string | null | undefined): string {
	return value?.trim().toLowerCase().replace(/[^a-z0-9]/g, "") ?? ""
}

export function isOrderFilledTrade(trade: { trade_type?: string | null }): boolean {
	const tradeType = normalizeTradeField(trade.trade_type)
	return tradeType === "orderfilled" || tradeType === "ordersmatched" || tradeType === "0"
}

export function isBuyTrade(trade: { side?: string | null }): boolean {
	const side = normalizeTradeField(trade.side)
	return side === "buy" || side === "0"
}

export function getActivityLabel(trade: { trade_type?: string | null }): string {
	const tradeType = normalizeTradeField(trade.trade_type)

	if (tradeType === "redemption" || tradeType === "1") return "Redeemed"
	if (tradeType === "merge" || tradeType === "2") return "Merged"
	if (!trade.trade_type) return "Activity"
	if (/^\d+$/.test(trade.trade_type)) return `Type ${trade.trade_type}`

	return trade.trade_type.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")
}
