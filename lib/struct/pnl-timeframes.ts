export const pnlTimeframeValues = ["1d", "1w", "1m", "all"] as const;

export type PnlTimeframe = (typeof pnlTimeframeValues)[number];

export const pnlAnchorValues = ["day", "week", "month", "year"] as const;

export type PnlAnchor = (typeof pnlAnchorValues)[number];

export type StructPnlCandleResolution = "1m" | "1h" | "4h" | "1d" | "auto";
export type StructPnlCandleTimeframe = "1d" | "7d" | "30d" | "lifetime";
export type StructPnlPeriodTimeframe = "1d" | "24h" | "7d" | "30d" | "lifetime";

export const PNL_TIMEFRAMES: Record<PnlTimeframe, { timeframe: StructPnlCandleTimeframe; resolution: StructPnlCandleResolution }> = {
	"1d": { timeframe: "1d", resolution: "auto" },
	"1w": { timeframe: "7d", resolution: "auto" },
	"1m": { timeframe: "30d", resolution: "auto" },
	all: { timeframe: "lifetime", resolution: "auto" },
};

export const PNL_RISK_TIMEFRAMES: Record<PnlTimeframe, StructPnlPeriodTimeframe> = {
	"1d": "1d",
	"1w": "7d",
	"1m": "30d",
	all: "lifetime",
};

const MAX_BUCKETS = 500;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * 60;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

export function pickPnlResolutionForSpan(spanSeconds: number): StructPnlCandleResolution {
	if (spanSeconds <= MAX_BUCKETS * SECONDS_PER_MINUTE) return "1m";
	if (spanSeconds <= MAX_BUCKETS * SECONDS_PER_HOUR) return "1h";
	return "1d";
}

export function pickPnlResolutionForTz(
	resolution: StructPnlCandleResolution,
	timezone: string | undefined,
	spanSeconds: number,
): StructPnlCandleResolution {
	if (resolution !== "1d") return resolution;
	if (!timezone || timezone === "UTC") return resolution;
	if (spanSeconds <= MAX_BUCKETS * SECONDS_PER_HOUR) return "1h";
	return resolution;
}

export const MAX_PNL_BUCKETS = MAX_BUCKETS;
export const PNL_SECONDS_PER_DAY = SECONDS_PER_DAY;
