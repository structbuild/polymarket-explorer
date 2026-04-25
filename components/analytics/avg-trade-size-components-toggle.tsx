"use client";

import { VolumeComponentsToggle } from "@/components/analytics/volume-components-toggle";
import { useAvgTradeSizeComponents } from "@/lib/hooks/use-avg-trade-size-components";

export function AvgTradeSizeComponentsToggle() {
	const [components, setComponents] = useAvgTradeSizeComponents();
	return (
		<VolumeComponentsToggle
			components={components}
			onChange={setComponents}
			label="Use for avg trade size"
			buttonSize="icon-sm"
			buttonClassName="text-muted-foreground hover:text-foreground group-data-[share-mode=image]/share-card:hidden"
		/>
	);
}
