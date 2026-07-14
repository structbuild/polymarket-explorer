import type { ComboMarket } from "@structbuild/sdk";

import { normalizeComboLegs, type NormalizedComboLeg } from "@/lib/combo";

export const COMBO_TABLE_COLUMN_SIZES = {
	combo: 560,
	legs: 200,
	volume: 120,
	trades: 96,
	traders: 96,
	fees: 96,
	created: 120,
} as const;

export type ComboMarketRow = {
	id: string;
	conditionId: string;
	comboType: string;
	status: string | null;
	legCount: number;
	legsWon: number;
	legsLost: number;
	legsPending: number;
	impliedProbabilityYes: number | null;
	impliedProbabilityNo: number | null;
	price: number | null;
	usdVolume: number | null;
	sharesVolume: number | null;
	fees: number | null;
	txns: number | null;
	uniqueTraders: number | null;
	builderUsdVolume: number | null;
	createdAt: number | null;
	latestTradeAt: number | null;
	creator: string | null;
	legs: NormalizedComboLeg[];
	title: string;
};

function deriveComboTitle(market: ComboMarket): string {
	const labels = market.legs
		.map((leg) => leg.title || leg.question)
		.filter((label): label is string => Boolean(label));

	if (labels.length === 0) {
		return "Combo market";
	}

	const shown = labels.slice(0, 2);
	const base = shown.join(" + ");
	const remaining = Math.max(market.leg_count - shown.length, 0);
	return remaining > 0 ? `${base} +${remaining} more` : base;
}

export function comboMarketToRow(market: ComboMarket): ComboMarketRow {
	return {
		id: market.condition_id,
		conditionId: market.condition_id,
		comboType: market.combo_type,
		status: market.status ?? null,
		legCount: market.leg_count,
		legsWon: market.legs_won,
		legsLost: market.legs_lost,
		legsPending: market.legs_pending,
		impliedProbabilityYes: market.implied_probability_yes ?? null,
		impliedProbabilityNo: market.implied_probability_no ?? null,
		price: market.price ?? null,
		usdVolume: market.usd_volume ?? null,
		sharesVolume: market.shares_volume ?? null,
		fees: market.fees ?? null,
		txns: market.txns ?? null,
		uniqueTraders: market.unique_traders ?? null,
		builderUsdVolume: market.builder_usd_volume ?? null,
		createdAt: market.created_at ?? null,
		latestTradeAt: market.latest_trade_at ?? null,
		creator: market.creator ?? null,
		legs: normalizeComboLegs(market.legs),
		title: deriveComboTitle(market),
	};
}
