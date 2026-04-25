"use client";

import type { MetricPctChange } from "@structbuild/sdk";

import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { VolumeComponentsToggle } from "@/components/analytics/volume-components-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { useAvgTradeSizeComponents } from "@/lib/hooks/use-avg-trade-size-components";
import {
	computeAvgTradeSizePctChange,
	sumSelectedComponentTotals,
	type ComponentTotals,
} from "@/lib/struct/analytics-shared";

export function AvgTradeSizeKpiCard({
	label,
	volumeTotals,
	tradeCountTotals,
	changes,
}: {
	label: string;
	volumeTotals: ComponentTotals;
	tradeCountTotals: ComponentTotals;
	changes: MetricPctChange | null;
}) {
	const [components, setComponents] = useAvgTradeSizeComponents();

	const volumeSum = sumSelectedComponentTotals(volumeTotals, components);
	const countSum = sumSelectedComponentTotals(tradeCountTotals, components);
	const total = countSum > 0 ? volumeSum / countSum : 0;

	const pct = computeAvgTradeSizePctChange(changes?.volume_usd, changes?.txn_count);
	const pctLabel = formatPctChange(pct);

	return (
		<Card size="sm" className="rounded-lg px-2 ring-0">
			<CardContent className="flex flex-col gap-0.5">
				<div className="flex items-start justify-between gap-1">
					<p className="text-sm text-muted-foreground">{label}</p>
					<VolumeComponentsToggle
						components={components}
						onChange={setComponents}
						label="Use for avg trade size"
					/>
				</div>
				<p className="text-xl font-medium tabular-nums">
					{formatNumber(total, { compact: true, currency: true })}
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
}
