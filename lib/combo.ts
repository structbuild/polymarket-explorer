import type { ComboLeg, ComboLegDetail, Trade } from "@structbuild/sdk"

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

function isComboLegDetail(leg: ComboLeg | ComboLegDetail): leg is ComboLegDetail {
	return "market_slug" in leg || "leg_market_type" in leg
}

function readComboLegStatus(value: unknown): ComboLegStatus | null {
	return value === "won" || value === "lost" || value === "pending" ? value : null
}

export function normalizeComboLeg(leg: ComboLeg | ComboLegDetail): NormalizedComboLeg {
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

export function normalizeComboLegs(legs: ReadonlyArray<ComboLeg | ComboLegDetail>): NormalizedComboLeg[] {
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
