"use client";

import { VolumeComponentsToggle } from "@/components/analytics/volume-components-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import {
	DEFAULT_KPI_VOLUME_COMPONENTS,
	VOLUME_COMPONENT_IDS,
	isDefaultVolumeComponents,
	sumSelectedComponentTotals,
	type ComponentTotals,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export type ComponentPctMap = Partial<Record<VolumeComponentId, number | null>>;

function deserialize(raw: string): readonly VolumeComponentId[] {
	const parsed = JSON.parse(raw);
	if (!Array.isArray(parsed)) return DEFAULT_KPI_VOLUME_COMPONENTS;
	const valid = new Set<VolumeComponentId>(VOLUME_COMPONENT_IDS);
	const filtered = parsed.filter(
		(v): v is VolumeComponentId => typeof v === "string" && valid.has(v as VolumeComponentId),
	);
	if (filtered.length === 0) return DEFAULT_KPI_VOLUME_COMPONENTS;
	return VOLUME_COMPONENT_IDS.filter((id) => filtered.includes(id));
}

function formatPctChange(value: number | null): string | null {
	if (value === null || !Number.isFinite(value)) return null;
	const pct = value * 100;
	const sign = pct > 0 ? "+" : "";
	return `${sign}${pct.toFixed(1)}%`;
}

function pctToneClass(value: number | null): string {
	if (value === null || !Number.isFinite(value) || value === 0) {
		return "text-muted-foreground";
	}
	return value > 0
		? "text-emerald-600 dark:text-emerald-500"
		: "text-red-600 dark:text-red-500";
}

function resolvePct(
	components: readonly VolumeComponentId[],
	aggregatePct: number | null,
	componentPcts: ComponentPctMap,
): number | null {
	if (components.length === 1) {
		const single = componentPcts[components[0]];
		if (single !== undefined && single !== null) return single;
	}
	return aggregatePct;
}

export function ComponentsKpiCard({
	storageKey,
	label,
	defaultTotal,
	totals,
	aggregatePct,
	componentPcts = {},
	currency = false,
	toggleLabel,
}: {
	storageKey: string;
	label: string;
	defaultTotal: number;
	totals: ComponentTotals;
	aggregatePct: number | null;
	componentPcts?: ComponentPctMap;
	currency?: boolean;
	toggleLabel?: string;
}) {
	const [components, setComponents] = useLocalStorage<readonly VolumeComponentId[]>(
		storageKey,
		DEFAULT_KPI_VOLUME_COMPONENTS,
		{ deserialize },
	);

	const isDefault = isDefaultVolumeComponents(components);
	const total = isDefault ? defaultTotal : sumSelectedComponentTotals(totals, components);
	const pct = resolvePct(components, aggregatePct, componentPcts);
	const pctLabel = formatPctChange(pct);

	return (
		<Card size="sm" className="rounded-lg px-2 ring-0">
			<CardContent className="flex flex-col gap-0.5">
				<div className="flex items-start justify-between gap-1">
					<p className="text-sm text-muted-foreground">{label}</p>
					<VolumeComponentsToggle
						components={components}
						onChange={setComponents}
						label={toggleLabel ?? `Include in ${label.toLowerCase()}`}
					/>
				</div>
				<p className="text-xl font-medium tabular-nums">
					{formatNumber(total, { compact: true, currency })}
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
