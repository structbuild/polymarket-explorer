import type { ComboLeg, Trade } from "@structbuild/sdk"

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

export function rowComboType(row: unknown): ComboMarketType | null {
	if (typeof row !== "object" || row === null) return null
	return readComboType((row as { combo_type?: unknown }).combo_type)
}

export function readComboTradeCount(row: unknown): number | null {
	if (typeof row !== "object" || row === null) return null
	const value = (row as { combo_trade_count?: unknown }).combo_trade_count
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
}
