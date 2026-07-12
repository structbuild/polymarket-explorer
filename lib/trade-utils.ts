import type { TraderInfo, Trade } from "@structbuild/sdk"

export function hasTradeTrader(trade: Trade): trade is Trade & { trader: TraderInfo } {
	return "trader" in trade
}

export type OrderFilledTradeEvent = Extract<Trade, { trade_type: "OrderFilled" | "OrdersMatched" }>
export type ComboExecutionTradeEvent = Extract<Trade, { trade_type: "ComboExecution" }>
export type FillTradeEvent = OrderFilledTradeEvent | ComboExecutionTradeEvent

export function isOrderFilledTrade(trade: Trade): trade is OrderFilledTradeEvent {
	return trade.trade_type === "OrderFilled" || trade.trade_type === "OrdersMatched"
}

export function isComboTrade(trade: Trade): boolean {
	return trade.trade_type.startsWith("Combo")
}

export function isComboFillTrade(trade: Trade): trade is ComboExecutionTradeEvent {
	return trade.trade_type === "ComboExecution"
}

export function isFillTrade(trade: Trade): trade is FillTradeEvent {
	return isOrderFilledTrade(trade) || isComboFillTrade(trade)
}

export function isBuyTrade(trade: FillTradeEvent): boolean {
	const side = trade.side?.toString().trim().toLowerCase() ?? ""
	return side === "buy" || side === "0"
}

export const FILL_TRADE_TYPES = "OrderFilled,OrdersMatched,ComboExecution"

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
	Approval: "Approval",
	ComboCreation: "Combo Created",
	ComboExecution: "Combo Executed",
	ComboStatusUpdate: "Combo Updated",
	ComboPositionsSplit: "Combo Split",
	ComboPositionsMerged: "Combo Merged",
	ComboSplitOnCondition: "Combo Split on Condition",
	ComboMergedOnCondition: "Combo Merged on Condition",
	ComboExtracted: "Combo Extracted",
	ComboInjected: "Combo Injected",
	ComboConvertedToYesBasket: "Combo Converted to Yes Basket",
	ComboMergedFromYesBasket: "Combo Merged from Yes Basket",
	ComboCompressed: "Combo Compressed",
	ComboPositionRedeemed: "Combo Redeemed",
	ComboWrapped: "Combo Wrapped",
	ComboUnwrapped: "Combo Unwrapped",
	ComboHorizontalSplit: "Combo Horizontal Split",
	ComboHorizontalMerge: "Combo Horizontal Merge",
	ComboPositionConverted: "Combo Converted",
	ComboPositionMigrated: "Combo Migrated",
}

export function getActivityLabel(trade: Trade): string {
	return activityLabels[trade.trade_type] ?? "Activity"
}
