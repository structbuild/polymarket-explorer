"use client";

import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import {
	COMBO_RESOLUTIONS,
	COMBO_RESOLUTION_DESCRIPTIONS,
	COMBO_RESOLUTION_LABELS,
	DEFAULT_COMBO_RESOLUTION,
	normalizeComboResolution,
} from "@/components/combos/combo-resolution";

export function ComboResolutionToggle({ resolution }: { resolution: string }) {
	return (
		<AnalyticsUrlToggle
			paramKey="resolution"
			value={normalizeComboResolution(resolution)}
			options={COMBO_RESOLUTIONS}
			labels={COMBO_RESOLUTION_LABELS}
			descriptions={COMBO_RESOLUTION_DESCRIPTIONS}
			defaultValue={DEFAULT_COMBO_RESOLUTION}
			ariaLabelPrefix="Show"
		/>
	);
}
