import type { TraderPnlSummary } from "@structbuild/sdk";

import { formatDuration, formatNumber } from "@/lib/format";

export type TraderAxisId =
	| "profitability"
	| "winRate"
	| "volume"
	| "activity"
	| "patience"
	| "diversity"
	| "conviction";

export type TraderAxis = {
	id: TraderAxisId;
	label: string;
	description: string;
	score: number;
	rawLabel: string;
};

export type TraderArchetypeId =
	| "whale"
	| "pro"
	| "sniper"
	| "hodler"
	| "scalper"
	| "degen"
	| "generalist"
	| "rookie"
	| "trader";

export type TraderArchetype = {
	id: TraderArchetypeId;
	label: string;
	description: string;
};

export type TraderDna = {
	axes: TraderAxis[];
	archetype: TraderArchetype;
};

export type TraderDnaInputs = {
	summary: TraderPnlSummary;
	cumulativePnlUsd: number;
};

const AXIS_ORDER: TraderAxisId[] = [
	"profitability",
	"winRate",
	"volume",
	"activity",
	"patience",
	"diversity",
	"conviction",
];

const SECONDS_PER_DAY = 86_400;

function clamp(value: number, min = 0, max = 100): number {
	if (!Number.isFinite(value)) return min;
	return Math.max(min, Math.min(max, value));
}

function logScore(value: number, ceiling: number): number {
	if (!Number.isFinite(value) || value <= 0) return 0;
	const safeCeiling = Math.max(ceiling, 10);
	return clamp((100 * Math.log10(1 + value)) / Math.log10(1 + safeCeiling));
}

function symmetricLogScore(value: number, ceiling: number): number {
	if (!Number.isFinite(value)) return 50;
	const safeCeiling = Math.max(ceiling, 10);
	const magnitude = Math.log10(1 + Math.abs(value)) / Math.log10(1 + safeCeiling);
	const signed = Math.sign(value) * magnitude;
	return clamp(50 + 50 * signed);
}

function pickNum(value: number | null | undefined): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function txnCount(summary: TraderPnlSummary): number {
	return (
		pickNum(summary.total_buys) +
		pickNum(summary.total_sells) +
		pickNum(summary.total_redemptions) +
		pickNum(summary.total_merges)
	);
}

function avgTradeSize(summary: TraderPnlSummary): number {
	const count = txnCount(summary);
	if (count <= 0) return 0;
	return pickNum(summary.total_volume_usd) / count;
}

function computeAxis(id: TraderAxisId, inputs: TraderDnaInputs): TraderAxis {
	const { summary, cumulativePnlUsd } = inputs;
	switch (id) {
		case "profitability": {
			const pnl = pickNum(cumulativePnlUsd);
			return {
				id,
				label: "Profitability",
				description: "Lifetime cumulative PnL (matches the PnL chart) vs a ±$10M reference range.",
				score: symmetricLogScore(pnl, 10_000_000),
				rawLabel: formatNumber(pnl, { currency: true, compact: true }),
			};
		}
		case "winRate": {
			const pct = pickNum(summary.market_win_rate_pct);
			return {
				id,
				label: "Win rate",
				description: "Share of resolved markets the trader won.",
				score: clamp(pct),
				rawLabel: formatNumber(pct, { percent: true, decimals: 1 }),
			};
		}
		case "volume": {
			const vol = pickNum(summary.total_volume_usd);
			return {
				id,
				label: "Volume",
				description: "Lifetime notional volume vs a $10M reference.",
				score: logScore(vol, 10_000_000),
				rawLabel: formatNumber(vol, { currency: true, compact: true }),
			};
		}
		case "activity": {
			const count = txnCount(summary);
			return {
				id,
				label: "Activity",
				description: "Total trades (buys + sells + redemptions + merges) vs a 10K reference.",
				score: logScore(count, 10_000),
				rawLabel: formatNumber(count, { compact: true }),
			};
		}
		case "patience": {
			const hold = pickNum(summary.avg_hold_time_seconds);
			return {
				id,
				label: "Patience",
				description: "Average hold time per position vs a 90-day reference.",
				score: logScore(hold, 90 * SECONDS_PER_DAY),
				rawLabel: formatDuration(hold),
			};
		}
		case "diversity": {
			const markets = pickNum(summary.markets_traded);
			return {
				id,
				label: "Diversity",
				description: "Distinct markets traded vs a 500-market reference.",
				score: logScore(markets, 500),
				rawLabel: formatNumber(markets, { compact: true }),
			};
		}
		case "conviction": {
			const avg = avgTradeSize(summary);
			return {
				id,
				label: "Conviction",
				description: "Average ticket size per trade vs a $10K reference.",
				score: logScore(avg, 10_000),
				rawLabel: formatNumber(avg, { currency: true, compact: true }),
			};
		}
	}
}

type Scores = Record<TraderAxisId, number>;

function toScores(axes: TraderAxis[]): Scores {
	return axes.reduce((acc, axis) => {
		acc[axis.id] = axis.score;
		return acc;
	}, {} as Scores);
}

function classify(scores: Scores, summary: TraderPnlSummary): TraderArchetype {
	const totalTrades = txnCount(summary);

	if (totalTrades < 5) {
		return {
			id: "rookie",
			label: "Rookie",
			description: "Too few trades yet to form a distinct style.",
		};
	}

	if (scores.volume >= 80 && scores.conviction >= 70) {
		return {
			id: "whale",
			label: "Whale",
			description: "Heavy volume with large tickets — moves markets.",
		};
	}

	if (scores.profitability >= 75 && scores.winRate >= 65) {
		return {
			id: "pro",
			label: "Pro",
			description: "Consistent wins and strong lifetime PnL.",
		};
	}

	if (scores.winRate >= 70 && scores.patience >= 60 && scores.activity <= 55) {
		return {
			id: "sniper",
			label: "Sniper",
			description: "Few, patient entries with a high hit rate.",
		};
	}

	if (scores.patience >= 75 && scores.activity <= 45) {
		return {
			id: "hodler",
			label: "Hodler",
			description: "Holds positions for the long haul, rarely trades.",
		};
	}

	if (scores.activity >= 75 && scores.patience <= 30) {
		return {
			id: "scalper",
			label: "Scalper",
			description: "High-frequency in-and-out trading.",
		};
	}

	if (scores.activity >= 70 && scores.profitability <= 35) {
		return {
			id: "degen",
			label: "Degen",
			description: "Trades a lot, pays for it in PnL.",
		};
	}

	if (scores.diversity >= 75) {
		return {
			id: "generalist",
			label: "Generalist",
			description: "Spreads activity across a wide range of markets.",
		};
	}

	const lowEverywhere = AXIS_ORDER.every((id) => scores[id] < 40);
	if (lowEverywhere) {
		return {
			id: "rookie",
			label: "Rookie",
			description: "Early-stage profile — not yet a clear style.",
		};
	}

	return {
		id: "trader",
		label: "Trader",
		description: "Balanced profile without a dominant trait.",
	};
}

export function computeTraderDna(inputs: TraderDnaInputs): TraderDna {
	const axes = AXIS_ORDER.map((id) => computeAxis(id, inputs));
	const archetype = classify(toScores(axes), inputs.summary);
	return { axes, archetype };
}

export const PEER_BASELINE_SCORE = 50;
