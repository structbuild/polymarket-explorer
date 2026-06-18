import type { BuilderFeeRate, BuilderLatestRow } from "@structbuild/sdk";

import { BUILDER_SORT_DESCRIPTIONS } from "@/lib/struct/builder-shared";

export type CompareMetricFormat = "currency" | "count" | "bps" | "volume";

export type CompareMetric = {
	id: string;
	label: string;
	description?: string;
	format: CompareMetricFormat;
	higherIsBetter: boolean;
	neutral?: boolean;
	accessor: (row: BuilderLatestRow, fees: BuilderFeeRate | null) => number | null;
};

export function bpsToLabel(bps: number | null | undefined): string {
	if (bps == null) return "—";
	return `${(bps / 100).toFixed(2)}%`;
}

function makerFeeBps(row: BuilderLatestRow, fees: BuilderFeeRate | null): number | null {
	return fees?.builder_maker_fee_rate_bps ?? row.builder_maker_fee_rate_bps ?? null;
}

function takerFeeBps(row: BuilderLatestRow, fees: BuilderFeeRate | null): number | null {
	return fees?.builder_taker_fee_rate_bps ?? row.builder_taker_fee_rate_bps ?? null;
}

export const COMPARE_METRICS: readonly CompareMetric[] = [
	{
		id: "volume",
		label: "Volume",
		format: "volume",
		higherIsBetter: true,
		accessor: (row) => row.volume_usd ?? null,
	},
	{
		id: "builder_fees",
		label: "Builder fees",
		format: "currency",
		higherIsBetter: true,
		accessor: (row) => row.builder_fees ?? null,
	},
	{
		id: "traders",
		label: "Traders",
		format: "count",
		higherIsBetter: true,
		accessor: (row) => row.unique_traders ?? null,
	},
	{
		id: "trades",
		label: "Trades",
		format: "count",
		higherIsBetter: true,
		accessor: (row) => row.txn_count ?? null,
	},
	{
		id: "new_users",
		label: "New users",
		description: BUILDER_SORT_DESCRIPTIONS.new_users,
		format: "count",
		higherIsBetter: true,
		accessor: (row) => row.new_users ?? null,
	},
	{
		id: "avg_rev_per_user",
		label: "ARPU",
		description: BUILDER_SORT_DESCRIPTIONS.avg_rev_per_user,
		format: "currency",
		higherIsBetter: true,
		accessor: (row) => row.avg_rev_per_user ?? null,
	},
	{
		id: "avg_vol_per_user",
		label: "AVPU",
		description: BUILDER_SORT_DESCRIPTIONS.avg_vol_per_user,
		format: "currency",
		higherIsBetter: true,
		accessor: (row) => row.avg_vol_per_user ?? null,
	},
	{
		id: "builder_maker_fee_rate_bps",
		label: "Maker fee",
		description: BUILDER_SORT_DESCRIPTIONS.builder_maker_fee_rate_bps,
		format: "bps",
		higherIsBetter: false,
		neutral: true,
		accessor: makerFeeBps,
	},
	{
		id: "builder_taker_fee_rate_bps",
		label: "Taker fee",
		description: BUILDER_SORT_DESCRIPTIONS.builder_taker_fee_rate_bps,
		format: "bps",
		higherIsBetter: false,
		neutral: true,
		accessor: takerFeeBps,
	},
] as const;
