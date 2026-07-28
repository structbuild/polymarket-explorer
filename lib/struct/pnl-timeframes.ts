export const pnlTimeframeValues = ["1d", "1w", "1m", "all"] as const;

export type PnlTimeframe = (typeof pnlTimeframeValues)[number];

export const pnlAnchorValues = ["day", "week", "month", "year"] as const;

export type PnlAnchor = (typeof pnlAnchorValues)[number];

export type StructPnlCandleResolution = "1m" | "1h" | "4h" | "1d" | "auto";
export type StructPnlCandleTimeframe = "1d" | "7d" | "30d" | "lifetime";
export type StructPnlPeriodTimeframe = "1d" | "24h" | "7d" | "30d" | "lifetime";

export const PNL_TIMEFRAMES: Record<PnlTimeframe, { timeframe: StructPnlCandleTimeframe }> = {
	"1d": { timeframe: "1d" },
	"1w": { timeframe: "7d" },
	"1m": { timeframe: "30d" },
	all: { timeframe: "lifetime" },
};

export const PNL_RISK_TIMEFRAMES: Record<PnlTimeframe, StructPnlPeriodTimeframe> = {
	"1d": "1d",
	"1w": "7d",
	"1m": "30d",
	all: "lifetime",
};
