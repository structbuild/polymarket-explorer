import type { MetricPctChange } from "@structbuild/sdk";

import { AvgTradeSizeKpiCard } from "@/components/analytics/avg-trade-size-kpi-card";
import { ComponentsKpiCard } from "@/components/analytics/components-kpi-card";
import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatNumber } from "@/lib/format";
import type {
	AnalyticsMetricId,
	AnalyticsSummary,
	ComponentTotals,
} from "@/lib/struct/analytics-shared";

const VOLUME_STORAGE_KEY = "analytics:volumeComponents";
const TRADES_STORAGE_KEY = "analytics:tradeComponents";

type KpiSpec = {
	id: AnalyticsMetricId;
	key: keyof AnalyticsSummary;
	label: string;
	tooltip?: string;
	currency?: boolean;
	compact?: boolean;
	pctKey?: keyof MetricPctChange;
};

const KPIS: KpiSpec[] = [
	{ id: "volume", key: "totalVolumeUsd", label: "Volume", currency: true, compact: true, pctKey: "volume_usd" },
	{ id: "fees", key: "totalFeesUsd", label: "Fees", tooltip: "Shows only fees from orders matched/filled.", currency: true, compact: true, pctKey: "fees_usd" },
	{ id: "trades", key: "totalTxnCount", label: "Trades", compact: true, pctKey: "txn_count" },
	{ id: "uniqueTraders", key: "uniqueTradersTotal", label: "Unique traders", compact: true, pctKey: "unique_traders" },
	{ id: "avgTradeSize", key: "avgTradeSizeUsd", label: "Avg trade size", currency: true, compact: true },
];

function getPct(spec: KpiSpec, changes: MetricPctChange | null): number | null {
	if (!changes || !spec.pctKey) return null;
	const raw = changes[spec.pctKey];
	return typeof raw === "number" ? raw : null;
}

type AnalyticsKpiStripProps = {
	summary: AnalyticsSummary;
	changes: MetricPctChange | null;
	volumeComponentTotals: ComponentTotals;
	tradeCountComponentTotals: ComponentTotals;
	excludeMetrics?: readonly AnalyticsMetricId[];
};

function visibleKpis(excludeMetrics?: readonly AnalyticsMetricId[]): KpiSpec[] {
	if (!excludeMetrics || excludeMetrics.length === 0) return KPIS;
	const excluded = new Set(excludeMetrics);
	return KPIS.filter((kpi) => !excluded.has(kpi.id));
}

const LG_GRID_BY_COUNT: Record<number, string> = {
	1: "lg:grid-cols-1",
	2: "lg:grid-cols-2",
	3: "lg:grid-cols-3",
	4: "lg:grid-cols-4",
	5: "lg:grid-cols-5",
};

function gridColsClass(count: number): string {
	const lg = LG_GRID_BY_COUNT[count] ?? "lg:grid-cols-5";
	const sm = count <= 2 ? "sm:grid-cols-2" : "sm:grid-cols-3";
	return `grid grid-cols-2 gap-3 ${sm} ${lg}`;
}

export function AnalyticsKpiStrip({
	summary,
	changes,
	volumeComponentTotals,
	tradeCountComponentTotals,
	excludeMetrics,
}: AnalyticsKpiStripProps) {
	const kpis = visibleKpis(excludeMetrics);
	const volumeComponentPcts = {
		buy: changes?.buy_volume_usd ?? null,
		sell: changes?.sell_volume_usd ?? null,
	};
	return (
		<div className={gridColsClass(kpis.length)}>
			{kpis.map((kpi) => {
				if (kpi.id === "volume") {
					return (
						<ComponentsKpiCard
							key={kpi.key}
							storageKey={VOLUME_STORAGE_KEY}
							label={kpi.label}
							defaultTotal={summary[kpi.key]}
							totals={volumeComponentTotals}
							aggregatePct={changes?.volume_usd ?? null}
							componentPcts={volumeComponentPcts}
							currency
						/>
					);
				}
				if (kpi.id === "trades") {
					return (
						<ComponentsKpiCard
							key={kpi.key}
							storageKey={TRADES_STORAGE_KEY}
							label={kpi.label}
							defaultTotal={summary[kpi.key]}
							totals={tradeCountComponentTotals}
							aggregatePct={changes?.txn_count ?? null}
							toggleLabel="Include in trades"
						/>
					);
				}
				if (kpi.id === "avgTradeSize") {
					return (
						<AvgTradeSizeKpiCard
							key={kpi.key}
							label={kpi.label}
							volumeTotals={volumeComponentTotals}
							tradeCountTotals={tradeCountComponentTotals}
							changes={changes}
						/>
					);
				}
				const pct = getPct(kpi, changes);
				const pctLabel = formatPctChange(pct);
				return (
					<Card key={kpi.key} size="sm" className="rounded-lg px-2 ring-0">
						<CardContent className="flex flex-col gap-0.5">
							<div className="flex items-center gap-1">
								<p className="text-sm text-muted-foreground">{kpi.label}</p>
								{kpi.tooltip ? <InfoTooltip content={kpi.tooltip} /> : null}
							</div>
							<p className="text-xl font-medium tabular-nums">
								{formatNumber(summary[kpi.key], {
									compact: kpi.compact,
									currency: kpi.currency,
								})}
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

export function AnalyticsKpiStripFallback({
	excludeMetrics,
}: {
	excludeMetrics?: readonly AnalyticsMetricId[];
} = {}) {
	const kpis = visibleKpis(excludeMetrics);
	return (
		<div className={gridColsClass(kpis.length)}>
			{kpis.map((kpi) => (
				<Card key={kpi.key} size="sm" className="rounded-lg px-2 ring-0">
					<CardContent className="flex flex-col gap-0.5">
						<p className="text-sm text-muted-foreground">{kpi.label}</p>
						<div className="h-7 w-20 animate-pulse rounded bg-muted" />
						<div className="h-3 w-12 animate-pulse rounded bg-muted/70" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
