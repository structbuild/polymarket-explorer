import type { BuilderGlobalLatestRow, GlobalPctChange } from "@structbuild/sdk";

import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatNumber } from "@/lib/format";
import { BUILDER_SORT_DESCRIPTIONS } from "@/lib/struct/builder-shared";

type StatSpec = {
	key: keyof BuilderGlobalLatestRow;
	pctKey?: keyof GlobalPctChange;
	label: string;
	currency?: boolean;
	compact?: boolean;
	description?: string;
};

const STATS: readonly StatSpec[] = [
	{ key: "volume_usd", pctKey: "volume_usd", label: "Volume", currency: true, compact: true },
	{ key: "builder_fees", pctKey: "builder_fees", label: "Builder fees", currency: true, compact: true },
	{ key: "unique_traders", pctKey: "unique_traders", label: "Traders", compact: true },
	{ key: "txn_count", pctKey: "txn_count", label: "Trades", compact: true },
	{ key: "distinct_builders", label: "Builders", compact: true },
	{
		key: "new_users",
		pctKey: "new_users",
		label: "New users",
		compact: true,
		description: BUILDER_SORT_DESCRIPTIONS.new_users,
	},
	{
		key: "avg_rev_per_user",
		pctKey: "avg_rev_per_user",
		label: "ARPU",
		currency: true,
		compact: true,
		description: BUILDER_SORT_DESCRIPTIONS.avg_rev_per_user,
	},
	{
		key: "avg_vol_per_user",
		pctKey: "avg_vol_per_user",
		label: "AVPU",
		currency: true,
		compact: true,
		description: BUILDER_SORT_DESCRIPTIONS.avg_vol_per_user,
	},
];

const GRID_CLASS = "grid grid-cols-2 gap-3 sm:grid-cols-4";

type BuildersGlobalStatsProps = {
	row: BuilderGlobalLatestRow | null;
	changes: GlobalPctChange | null;
};

export function BuildersGlobalStats({ row, changes }: BuildersGlobalStatsProps) {
	if (!row) return null;

	return (
		<div className={GRID_CLASS}>
			{STATS.map(({ key, pctKey, label, currency, compact, description }) => {
				const value = Number(row[key] ?? 0);
				const pct = pctKey && changes ? changes[pctKey] : null;
				const pctLabel = formatPctChange(pct);
				return (
					<Card key={String(key)} size="sm" className="px-2 rounded-lg ring-0">
						<CardContent className="flex flex-col gap-0.5">
							<p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
								<span>{label}</span>
								{description ? <InfoTooltip content={description} /> : null}
							</p>
							<div className="flex items-baseline gap-2">
								<p className="text-2xl font-medium tabular-nums">
									{formatNumber(value, { compact, currency })}
								</p>
								{pctLabel ? (
									<span className={`text-xs font-medium tabular-nums ${pctToneClass(pct)}`}>
										{pctLabel}
									</span>
								) : null}
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}

export function BuildersGlobalStatsFallback() {
	return (
		<div className={GRID_CLASS}>
			{Array.from({ length: STATS.length }, (_, i) => (
				<Card key={i} size="sm" className="px-2 rounded-lg ring-0">
					<CardContent className="flex flex-col gap-0.5">
						<div className="h-5 w-16 animate-pulse rounded bg-muted" />
						<div className="h-8 w-24 animate-pulse rounded bg-muted" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
