import type { TraderTab } from "@/lib/trader-search-params-shared"

export type TraderTabPanelBundleKind = "activity" | "positions"

export const loadTraderActivity = () => import("./activity")
export const loadTraderPositions = () => import("./positions")

export function getTraderTabPanelBundleKind(
	tab: TraderTab,
): TraderTabPanelBundleKind {
	return tab === "activity" ? "activity" : "positions"
}

export function preloadTraderTabPanelBundle(tab: TraderTab) {
	return tab === "activity" ? loadTraderActivity() : loadTraderPositions()
}
