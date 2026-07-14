import type {
	ComboGlobalAnalyticsChanges,
	ComboGlobalAnalyticsCountsResponse,
} from "@structbuild/sdk";

import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

type ComboKpiSpec = {
	key: string;
	label: string;
	value: (counts: ComboGlobalAnalyticsCountsResponse) => number;
	pctKey: keyof ComboGlobalAnalyticsChanges;
	currency?: boolean;
};

const KPIS: ComboKpiSpec[] = [
	{ key: "volume", label: "Total volume", value: (c) => c.usd_volume, pctKey: "usd_volume", currency: true },
	{ key: "trades", label: "Trades", value: (c) => c.txns, pctKey: "txns" },
	{ key: "fees", label: "Fees", value: (c) => c.fees, pctKey: "fees", currency: true },
	{ key: "creations", label: "Combos created", value: (c) => c.lifecycle.creations, pctKey: "creations" },
	{ key: "executions", label: "Executions", value: (c) => c.lifecycle.executions, pctKey: "executions" },
];

function getPct(spec: ComboKpiSpec, changes: ComboGlobalAnalyticsChanges | null): number | null {
	if (!changes) return null;
	const raw = changes[spec.pctKey];
	return typeof raw === "number" ? raw : null;
}

type ComboAnalyticsKpiProps = {
	counts: ComboGlobalAnalyticsCountsResponse;
	changes: ComboGlobalAnalyticsChanges | null;
};

export function ComboAnalyticsKpi({ counts, changes }: ComboAnalyticsKpiProps) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
			{KPIS.map((kpi) => {
				const pct = getPct(kpi, changes);
				const pctLabel = formatPctChange(pct);
				return (
					<Card key={kpi.key} size="sm" className="rounded-lg px-2 ring-0">
						<CardContent className="flex flex-col gap-0.5">
							<p className="text-sm text-muted-foreground">{kpi.label}</p>
							<p className="text-xl font-medium tabular-nums">
								{formatNumber(kpi.value(counts), { compact: true, currency: kpi.currency })}
							</p>
							{pctLabel ? (
								<p className={`text-xs font-medium tabular-nums ${pctToneClass(pct)}`}>
									{pctLabel}
								</p>
							) : (
								<p className="select-none text-xs text-transparent">—</p>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
