"use client";

import { formatPctChange, pctToneClass } from "@/components/analytics/pct-display";
import { VolumeComponentsToggle } from "@/components/analytics/volume-components-toggle";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import {
	DEFAULT_KPI_VOLUME_COMPONENTS,
	VOLUME_COMPONENT_IDS,
	deserializeVolumeComponents,
	isDefaultVolumeComponents,
	sumSelectedComponentTotals,
	type ComponentTotals,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export type ComponentPctMap = Partial<Record<VolumeComponentId, number | null>>;

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
	allowedComponents,
}: {
	storageKey: string;
	label: string;
	defaultTotal: number;
	totals: ComponentTotals;
	aggregatePct: number | null;
	componentPcts?: ComponentPctMap;
	currency?: boolean;
	toggleLabel?: string;
	allowedComponents?: readonly VolumeComponentId[];
}) {
	const [components, setComponents] = useLocalStorage<readonly VolumeComponentId[]>(
		storageKey,
		DEFAULT_KPI_VOLUME_COMPONENTS,
		{ deserialize: deserializeVolumeComponents },
	);

	const allowed = allowedComponents ?? VOLUME_COMPONENT_IDS;
	const selectedComponents = components.filter((component) => allowed.includes(component));
	const effectiveComponents =
		selectedComponents.length > 0 ? selectedComponents : allowed;
	const isDefault =
		allowed.length === VOLUME_COMPONENT_IDS.length
			? isDefaultVolumeComponents(effectiveComponents)
			: effectiveComponents.length === allowed.length;
	const total = isDefault ? defaultTotal : sumSelectedComponentTotals(totals, effectiveComponents);
	const pct = resolvePct(effectiveComponents, aggregatePct, componentPcts);
	const pctLabel = formatPctChange(pct);

	return (
		<Card size="sm" className="rounded-lg px-2 ring-0">
			<CardContent className="flex flex-col gap-0.5">
				<div className="flex items-start justify-between gap-1">
					<p className="text-sm text-muted-foreground">{label}</p>
					<VolumeComponentsToggle
						components={effectiveComponents}
						onChange={setComponents}
						allowedComponents={allowed}
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
