export const CHANGELOG_ILLUSTRATION_IDS = [
	"combos-hub",
	"combo-detail",
	"combo-analytics",
	"trader-combos",
	"trader-pnl-by-category",
	"builder-compare",
	"trader-category-leaderboards",
	"trader-pnl-chart-updates",
	"trader-best-worst-trades",
	"trader-performance-summary",
	"market-top-traders",
	"analytics-rewards-incentives",
] as const;

export type ChangelogIllustrationId = (typeof CHANGELOG_ILLUSTRATION_IDS)[number];

const idSet: ReadonlySet<string> = new Set(CHANGELOG_ILLUSTRATION_IDS);

export function hasChangelogIllustration(id: string): id is ChangelogIllustrationId {
	return idSet.has(id);
}
