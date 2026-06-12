"use client";

import type { AnalyticsMetricPctChange } from "@structbuild/sdk";

import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { VolumeComponentsToggle } from "@/components/analytics/volume-components-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { Volume } from "@/components/ui/volume";
import { formatNumber } from "@/lib/format";
import { useAvgTradeSizeComponents } from "@/lib/hooks/use-avg-trade-size-components";
import { useVolumeMode } from "@/lib/hooks/use-volume-mode";
import {
	VOLUME_COMPONENT_IDS,
	computeAvgTradeSizePctChange,
	isDefaultVolumeComponents,
	sumSelectedComponentTotals,
	type AnalyticsSummary,
	type ComponentTotals,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export function AvgTradeSizeKpiCard({
	label,
	summary,
	volumeTotals,
	tradeCountTotals,
	changes,
	allowedComponents,
}: {
	label: string;
	summary: AnalyticsSummary;
	volumeTotals: ComponentTotals;
	tradeCountTotals: ComponentTotals;
	changes: AnalyticsMetricPctChange | null;
	allowedComponents?: readonly VolumeComponentId[];
}) {
	const { mode } = useVolumeMode();
	const [storedComponents, setComponents] = useAvgTradeSizeComponents();
	const allowed = allowedComponents ?? VOLUME_COMPONENT_IDS;
	const selectedComponents = storedComponents.filter((component) =>
		allowed.includes(component),
	);
	const components = selectedComponents.length > 0 ? selectedComponents : allowed;

	const volumeSum = sumSelectedComponentTotals(volumeTotals, components);
	const countSum = sumSelectedComponentTotals(tradeCountTotals, components);
	const usdTotal = countSum > 0 ? volumeSum / countSum : 0;

	const isDefault =
		allowed.length === VOLUME_COMPONENT_IDS.length
			? isDefaultVolumeComponents(components)
			: components.length === allowed.length;

	const showNotional = mode === "notional" && isDefault;
	const sharesTotal = summary.avgTradeSizeShares;

	const usdPct = computeAvgTradeSizePctChange(changes?.volume_usd, changes?.txn_count);
	const sharesPct = computeAvgTradeSizePctChange(changes?.shares_volume, changes?.txn_count);
	const pct = showNotional ? sharesPct : usdPct;
	const pctLabel = formatPctChange(pct);

	const showBreakdownNote = mode === "notional" && !isDefault;

	return (
		<Card size="sm" className="rounded-lg px-2 ring-0">
			<CardContent className="flex flex-col gap-0.5">
				<div className="flex items-start justify-between gap-1">
					<p className="text-sm text-muted-foreground">{label}</p>
					<VolumeComponentsToggle
						components={components}
						onChange={setComponents}
						allowedComponents={allowed}
						label="Use for avg trade size"
					/>
				</div>
				{showNotional ? (
					<p className="text-xl font-medium tabular-nums">
						<Volume usd={usdTotal} shares={sharesTotal} compact noTooltip />
					</p>
				) : (
					<p className="text-xl font-medium tabular-nums">
						{formatNumber(usdTotal, { compact: true, currency: true })}
					</p>
				)}
				{pctLabel ? (
					<p className={`text-xs font-medium tabular-nums ${pctToneClass(pct)}`}>
						{pctLabel}
					</p>
				) : (
					<p className="select-none text-xs text-transparent">—</p>
				)}
				{showBreakdownNote ? (
					<p className="text-[10px] text-muted-foreground/70">USD shown for component breakdown</p>
				) : null}
			</CardContent>
		</Card>
	);
}
