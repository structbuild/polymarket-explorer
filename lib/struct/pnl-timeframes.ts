export const pnlTimeframeValues = ["1d", "1w", "1m", "all"] as const;

export type PnlTimeframe = (typeof pnlTimeframeValues)[number];

export type StructPnlCandleResolution = "1m" | "1h" | "1d";
export type StructPnlCandleTimeframe = "1d" | "7d" | "30d" | "lifetime";
export type StructPnlPeriodTimeframe = "1d" | "24h" | "7d" | "30d" | "lifetime";

export const PNL_TIMEFRAMES: Record<PnlTimeframe, { timeframe: StructPnlCandleTimeframe; resolution: StructPnlCandleResolution }> = {
	"1d": { timeframe: "1d", resolution: "1m" },
	"1w": { timeframe: "7d", resolution: "1h" },
	"1m": { timeframe: "30d", resolution: "1h" },
	all: { timeframe: "lifetime", resolution: "1h" },
};

export const PNL_RISK_TIMEFRAMES: Record<PnlTimeframe, StructPnlPeriodTimeframe> = {
	"1d": "1d",
	"1w": "7d",
	"1m": "30d",
	all: "lifetime",
};
