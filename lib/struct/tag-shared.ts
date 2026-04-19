import type { TagSortBy, TagSortTimeframe } from "@structbuild/sdk";

export const TAG_SORT_OPTIONS: readonly TagSortBy[] = ["volume", "txns", "traders", "fees"];

export const TAG_SORT_LABELS: Record<TagSortBy, string> = {
	volume: "Volume",
	txns: "Trades",
	traders: "Traders",
	fees: "Fees",
};

export const DEFAULT_TAG_SORT: TagSortBy = "volume";

export function parseTagSort(value: string | string[] | undefined): TagSortBy {
	const raw = Array.isArray(value) ? value[0] : value;
	return TAG_SORT_OPTIONS.includes(raw as TagSortBy) ? (raw as TagSortBy) : DEFAULT_TAG_SORT;
}

export const TAG_TIMEFRAME_OPTIONS: readonly TagSortTimeframe[] = ["24h", "7d", "30d", "lifetime"];

export const TAG_TIMEFRAME_LABELS: Record<TagSortTimeframe, string> = {
	lifetime: "All",
	"1h": "1h",
	"24h": "24h",
	"7d": "7d",
	"30d": "30d",
	"1mo": "1mo",
	"1y": "1y",
};

export const DEFAULT_TAG_TIMEFRAME: TagSortTimeframe = "lifetime";

export function parseTagTimeframe(value: string | string[] | undefined): TagSortTimeframe {
	const raw = Array.isArray(value) ? value[0] : value;
	return TAG_TIMEFRAME_OPTIONS.includes(raw as TagSortTimeframe)
		? (raw as TagSortTimeframe)
		: DEFAULT_TAG_TIMEFRAME;
}

