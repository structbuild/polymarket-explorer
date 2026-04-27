import type {
	BuilderSortBy,
	BuilderTimeframe,
	TopTradersSortBy,
} from "@structbuild/sdk";

export const BUILDER_SORT_OPTIONS = [
	"volume",
	"txns",
	"traders",
	"fees",
	"builder_fees",
	"new_users",
	"avg_rev_per_user",
	"avg_vol_per_user",
	"builder_maker_fee_rate_bps",
	"builder_taker_fee_rate_bps",
] as const satisfies readonly BuilderSortBy[];

type BuilderSortOption = (typeof BUILDER_SORT_OPTIONS)[number];

export const BUILDER_SORT_LABELS: Record<BuilderSortOption, string> = {
	volume: "Volume",
	txns: "Trades",
	traders: "Traders",
	fees: "Fees",
	builder_fees: "Builder fees",
	new_users: "New users",
	avg_rev_per_user: "Avg revenue/user",
	avg_vol_per_user: "Avg volume/user",
	builder_maker_fee_rate_bps: "Maker fee",
	builder_taker_fee_rate_bps: "Taker fee",
};

export const BUILDER_SORT_DESCRIPTIONS: Partial<Record<BuilderSortOption, string>> = {
	new_users: "Traders whose first builder-routed trade happened in the selected window.",
	avg_rev_per_user: "Average revenue per user: builder fees divided by unique traders in the selected window.",
	avg_vol_per_user: "Average volume per user: routed volume divided by unique traders in the selected window.",
	builder_maker_fee_rate_bps: "Current maker-side builder fee rate. 100 bps equals 1%.",
	builder_taker_fee_rate_bps: "Current taker-side builder fee rate. 100 bps equals 1%.",
};

export const DEFAULT_BUILDER_SORT: BuilderSortBy = "volume";

export function parseBuilderSort(value: string | string[] | undefined): BuilderSortBy {
	const raw = Array.isArray(value) ? value[0] : value;
	return BUILDER_SORT_OPTIONS.includes(raw as BuilderSortOption)
		? (raw as BuilderSortBy)
		: DEFAULT_BUILDER_SORT;
}

export const BUILDER_TIMEFRAME_OPTIONS = [
	"1d",
	"7d",
	"30d",
	"lifetime",
] as const satisfies readonly BuilderTimeframe[];

export const BUILDER_TIMEFRAME_LABELS: Record<BuilderTimeframe, string> = {
	"1d": "1d",
	"7d": "7d",
	"30d": "30d",
	lifetime: "All",
};

export const DEFAULT_BUILDER_TIMEFRAME: BuilderTimeframe = "30d";

export function parseBuilderTimeframe(value: string | string[] | undefined): BuilderTimeframe {
	const raw = Array.isArray(value) ? value[0] : value;
	return BUILDER_TIMEFRAME_OPTIONS.includes(raw as BuilderTimeframe)
		? (raw as BuilderTimeframe)
		: DEFAULT_BUILDER_TIMEFRAME;
}

export const TOP_TRADERS_SORT_OPTIONS = [
	"volume",
	"txns",
	"fees",
	"builder_fees",
] as const satisfies readonly TopTradersSortBy[];

type TopTradersSortOption = (typeof TOP_TRADERS_SORT_OPTIONS)[number];

export const TOP_TRADERS_SORT_LABELS: Record<TopTradersSortOption, string> = {
	volume: "Volume",
	txns: "Trades",
	fees: "Fees",
	builder_fees: "Builder fees",
};

export const DEFAULT_TOP_TRADERS_SORT: TopTradersSortBy = "volume";

export function parseTopTradersSort(value: string | string[] | undefined): TopTradersSortBy {
	const raw = Array.isArray(value) ? value[0] : value;
	return TOP_TRADERS_SORT_OPTIONS.includes(raw as TopTradersSortOption)
		? (raw as TopTradersSortBy)
		: DEFAULT_TOP_TRADERS_SORT;
}
