import type { BuilderFeeRate, BuilderLatestRow } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { BUILDER_SORT_DESCRIPTIONS } from "@/lib/struct/builder-shared";

type Stat = {
	label: string;
	display: string;
	description?: string;
};

const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-4";

function bpsToLabel(bps: number | null | undefined): string {
	if (bps == null) return "—";
	return `${(bps / 100).toFixed(2)}%`;
}

function buildStats(row: BuilderLatestRow, fees: BuilderFeeRate | null): Stat[] {
	const baseStats: Stat[] = [
		{
			label: "Volume",
			display: formatNumber(row.volume_usd, { compact: true, currency: true }),
		},
		{
			label: "Builder fees",
			display: formatNumber(row.builder_fees, { compact: true, currency: true }),
		},
		{
			label: "Traders",
			display: formatNumber(row.unique_traders, { compact: true }),
		},
		{
			label: "Trades",
			display: formatNumber(row.txn_count, { compact: true }),
		},
		{
			label: "New users",
			display: formatNumber(row.new_users, { compact: true }),
			description: BUILDER_SORT_DESCRIPTIONS.new_users,
		},
		{
			label: "ARPU",
			display: formatNumber(row.avg_rev_per_user, { compact: true, currency: true }),
			description: BUILDER_SORT_DESCRIPTIONS.avg_rev_per_user,
		},
		{
			label: "AVPU",
			display: formatNumber(row.avg_vol_per_user, { compact: true, currency: true }),
			description: BUILDER_SORT_DESCRIPTIONS.avg_vol_per_user,
		},
	];

	const makerFeeBps = fees?.builder_maker_fee_rate_bps ?? row.builder_maker_fee_rate_bps;
	const takerFeeBps = fees?.builder_taker_fee_rate_bps ?? row.builder_taker_fee_rate_bps;

	if (makerFeeBps != null || takerFeeBps != null) {
		baseStats.push({
			label: `Maker / taker${fees && !fees.enabled ? " (off)" : ""}`,
			display: `${bpsToLabel(makerFeeBps)} / ${bpsToLabel(takerFeeBps)}`,
			description: `${BUILDER_SORT_DESCRIPTIONS.builder_maker_fee_rate_bps} ${BUILDER_SORT_DESCRIPTIONS.builder_taker_fee_rate_bps}`,
		});
	}

	return baseStats;
}

type BuilderStatsRowProps = {
	row: BuilderLatestRow;
	fees: BuilderFeeRate | null;
	className?: string;
};

export function BuilderStatsRow({ row, fees, className }: BuilderStatsRowProps) {
	const stats = buildStats(row, fees);
	return (
		<div className={cn(GRID_CLASS, className)}>
			{stats.map((stat) => (
				<Card key={stat.label} size="sm" className="px-2 rounded-lg ring-0">
					<CardContent className="flex flex-col gap-0.5">
						<p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
							<span>{stat.label}</span>
							{stat.description ? <InfoTooltip content={stat.description} /> : null}
						</p>
						<p className="text-2xl font-medium tabular-nums">{stat.display}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
