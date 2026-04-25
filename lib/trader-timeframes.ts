export const TRADER_TIMEFRAMES = ["1d", "7d", "30d", "lifetime"] as const;

export type TraderTimeframe = (typeof TRADER_TIMEFRAMES)[number];

export const TRADER_TIMEFRAME_LABELS: Record<TraderTimeframe, string> = {
	"1d": "24H",
	"7d": "7D",
	"30d": "30D",
	lifetime: "All",
};

export const DEFAULT_TRADER_TIMEFRAME: TraderTimeframe = "30d";

export function parseTraderTimeframe(value: string | string[] | undefined): TraderTimeframe {
	const raw = Array.isArray(value) ? value[0] : value;

	if (raw && (TRADER_TIMEFRAMES as readonly string[]).includes(raw)) {
		return raw as TraderTimeframe;
	}

	return DEFAULT_TRADER_TIMEFRAME;
}
