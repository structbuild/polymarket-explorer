import type {
	ComboLeg,
	ComboLegDetail,
	ComboMarketLeg,
	ComboMarketSortBy,
	ComboMarketStatusFilter,
	ComboMarketTimeframe,
	Trade,
} from "@structbuild/sdk"

export type ComboMarketType = "binary" | "negrisk" | "combinatorial"

export function readComboType(value: unknown): ComboMarketType | null {
	return value === "binary" || value === "negrisk" || value === "combinatorial" ? value : null
}

const comboTypeLabels: Record<ComboMarketType, string> = {
	binary: "Combo",
	negrisk: "Neg-risk",
	combinatorial: "Parlay",
}

const comboTypeDescriptions: Record<ComboMarketType, string> = {
	binary: "Binary combo market",
	negrisk: "Neg-risk combo market",
	combinatorial: "Combinatorial parlay across multiple markets",
}

export function comboTypeLabel(type: ComboMarketType): string {
	return comboTypeLabels[type]
}

export function comboTypeDescription(type: ComboMarketType): string {
	return comboTypeDescriptions[type]
}

export function getComboLegs(trade: Trade): ComboLeg[] {
	return "legs" in trade && Array.isArray(trade.legs) ? trade.legs : []
}

export type ComboLegStatus = "won" | "lost" | "pending"

export type NormalizedComboLeg = {
	positionId: string | null
	conditionId: string | null
	outcome: string | null
	outcomeIndex: number | null
	question: string | null
	title: string | null
	slug: string | null
	imageUrl: string | null
	status: ComboLegStatus | null
	lastPrice: number | null
}

export type AnyComboLeg = ComboLeg | ComboLegDetail | ComboMarketLeg

function isComboLegDetail(leg: AnyComboLeg): leg is ComboLegDetail | ComboMarketLeg {
	return "market_slug" in leg || "leg_market_type" in leg
}

function readComboLegStatus(value: unknown): ComboLegStatus | null {
	return value === "won" || value === "lost" || value === "pending" ? value : null
}

export function normalizeComboLeg(leg: AnyComboLeg): NormalizedComboLeg {
	const detail = isComboLegDetail(leg)
	return {
		positionId: leg.position_id ?? null,
		conditionId: leg.condition_id ?? null,
		outcome: leg.outcome ?? null,
		outcomeIndex: leg.outcome_index ?? null,
		question: leg.question ?? null,
		title: leg.title ?? null,
		slug: (detail ? leg.market_slug : leg.slug) ?? null,
		imageUrl: leg.image_url ?? null,
		status: detail ? readComboLegStatus(leg.status) : null,
		lastPrice: detail ? leg.last_price ?? null : null,
	}
}

export function normalizeComboLegs(legs: ReadonlyArray<AnyComboLeg>): NormalizedComboLeg[] {
	return legs.map(normalizeComboLeg)
}

export type ComboStatus =
	| "open"
	| "closed"
	| "resolved_win"
	| "resolved_loss"
	| "redeemable"
	| "redeemed"

const comboStatusLabels: Record<ComboStatus, string> = {
	open: "Open",
	closed: "Closed",
	resolved_win: "Won",
	resolved_loss: "Lost",
	redeemable: "Redeemable",
	redeemed: "Redeemed",
}

export function readComboStatus(value: unknown): ComboStatus | null {
	return typeof value === "string" && value in comboStatusLabels ? (value as ComboStatus) : null
}

export function comboStatusLabel(status: ComboStatus): string {
	return comboStatusLabels[status]
}

const comboLegStatusLabels: Record<ComboLegStatus, string> = {
	won: "Won",
	lost: "Lost",
	pending: "Pending",
}

export function comboLegStatusLabel(status: ComboLegStatus): string {
	return comboLegStatusLabels[status]
}

export function rowComboType(row: unknown): ComboMarketType | null {
	if (typeof row !== "object" || row === null) return null
	return readComboType((row as { combo_type?: unknown }).combo_type)
}

export function readComboTradeCount(row: unknown): number | null {
	if (typeof row !== "object" || row === null) return null
	const value = (row as { combo_trade_count?: unknown }).combo_trade_count
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
}

export type ComboMarketStatus =
	| "open"
	| "resolved_yes"
	| "resolved_no"
	| "resolved_split"
	| "resolved_zero"

const comboMarketStatusLabels: Record<ComboMarketStatus, string> = {
	open: "Open",
	resolved_yes: "Resolved Yes",
	resolved_no: "Resolved No",
	resolved_split: "Split",
	resolved_zero: "Void",
}

export type ComboMarketStatusTone = "open" | "positive" | "negative" | "neutral"

const comboMarketStatusTones: Record<ComboMarketStatus, ComboMarketStatusTone> = {
	open: "open",
	resolved_yes: "positive",
	resolved_no: "negative",
	resolved_split: "neutral",
	resolved_zero: "neutral",
}

export function readComboMarketStatus(value: unknown): ComboMarketStatus | null {
	return typeof value === "string" && value in comboMarketStatusLabels
		? (value as ComboMarketStatus)
		: null
}

export function comboMarketStatusLabel(status: ComboMarketStatus): string {
	return comboMarketStatusLabels[status]
}

export function comboMarketStatusTone(status: ComboMarketStatus): ComboMarketStatusTone {
	return comboMarketStatusTones[status]
}

export const COMBO_MARKET_STATUS_FILTERS: ReadonlyArray<ComboMarketStatusFilter> = [
	"open",
	"resolved_yes",
	"resolved_no",
	"resolved_split",
	"resolved_zero",
]

export const COMBO_MARKET_TIMEFRAMES: ReadonlyArray<ComboMarketTimeframe> = [
	"1h",
	"6h",
	"24h",
	"7d",
	"30d",
	"lifetime",
]

const comboMarketTimeframeLabels: Record<ComboMarketTimeframe, string> = {
	"1m": "1m",
	"5m": "5m",
	"30m": "30m",
	"1h": "1H",
	"6h": "6H",
	"24h": "24H",
	"7d": "7D",
	"30d": "30D",
	lifetime: "All",
}

export function comboMarketTimeframeLabel(timeframe: ComboMarketTimeframe): string {
	return comboMarketTimeframeLabels[timeframe]
}

export const COMBO_MARKET_SORT_KEYS: ReadonlyArray<ComboMarketSortBy> = [
	"usd_volume",
	"shares_volume",
	"unique_traders",
	"txns",
	"fees",
	"builder_usd_volume",
	"status",
]

const comboMarketSortLabels: Record<ComboMarketSortBy, string> = {
	usd_volume: "Volume",
	shares_volume: "Shares",
	unique_traders: "Traders",
	txns: "Trades",
	fees: "Fees",
	builder_usd_volume: "Builder Vol.",
	status: "Status",
}

export function comboMarketSortLabel(sortBy: ComboMarketSortBy): string {
	return comboMarketSortLabels[sortBy]
}

export function isComboMarketSortBy(value: unknown): value is ComboMarketSortBy {
	return typeof value === "string" && (COMBO_MARKET_SORT_KEYS as ReadonlyArray<string>).includes(value)
}

export function isComboMarketStatusFilter(value: unknown): value is ComboMarketStatusFilter {
	return (
		typeof value === "string" &&
		(COMBO_MARKET_STATUS_FILTERS as ReadonlyArray<string>).includes(value)
	)
}

export function isComboMarketTimeframe(value: unknown): value is ComboMarketTimeframe {
	return typeof value === "string" && value in comboMarketTimeframeLabels
}
