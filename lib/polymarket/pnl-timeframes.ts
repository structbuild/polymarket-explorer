export const pnlTimeframeValues = ["1d", "1w", "1m", "all"] as const;

export type PnlTimeframe = (typeof pnlTimeframeValues)[number];

export const PNL_TIMEFRAMES: Record<PnlTimeframe, { interval: string; fidelity: string }> = {
	"1d": { interval: "1d", fidelity: "5m" },
	"1w": { interval: "1w", fidelity: "1h" },
	"1m": { interval: "1m", fidelity: "3h" },
	all: { interval: "all", fidelity: "1h" },
};
