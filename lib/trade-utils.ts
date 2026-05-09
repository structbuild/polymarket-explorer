import type { TraderInfo, Trade } from "@structbuild/sdk"

export function hasTradeTrader(trade: Trade): trade is Trade & { trader: TraderInfo } {
	return "trader" in trade
}

export type OrderFilledTradeEvent = Extract<Trade, { trade_type: "OrderFilled" | "OrdersMatched" }>

export function isOrderFilledTrade(trade: Trade): trade is OrderFilledTradeEvent {
	return trade.trade_type === "OrderFilled" || trade.trade_type === "OrdersMatched"
}

export function isBuyTrade(trade: OrderFilledTradeEvent): boolean {
	const side = trade.side?.toString().trim().toLowerCase() ?? ""
	return side === "buy" || side === "0"
}

const activityLabels: Record<Trade["trade_type"], string> = {
	OrderFilled: "Order Filled",
	OrdersMatched: "Orders Matched",
	MakerRebate: "Maker Rebate",
	Reward: "Reward",
	Yield: "Yield",
	Redemption: "Redeemed",
	Merge: "Merged",
	Split: "Split",
	PositionsConverted: "Converted",
	Cancelled: "Cancelled",
	Initialization: "Initialized",
	Proposal: "Proposed",
	Dispute: "Disputed",
	Settled: "Settled",
	Resolution: "Resolved",
	ConditionResolution: "Condition Resolved",
	Reset: "Reset",
	Flag: "Flagged",
	Unflag: "Unflagged",
	Pause: "Paused",
	Unpause: "Unpaused",
	ManualResolution: "Manual Resolution",
	NegRiskOutcomeReported: "NegRisk Outcome Reported",
	RegisterToken: "Token Registered",
}

export function getActivityLabel(trade: Trade): string {
	return activityLabels[trade.trade_type] ?? "Activity"
}
