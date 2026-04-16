"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TIMEFRAME_LABELS, type MetricsTimeframeChoice } from "@/lib/timeframes";
import { cn } from "@/lib/utils";

type TimeframeToggleProps = {
	timeframes: readonly MetricsTimeframeChoice[];
	value: MetricsTimeframeChoice;
	onValueChange: (value: MetricsTimeframeChoice) => void;
	className?: string;
	"aria-label"?: string;
};

export function TimeframeToggle({
	timeframes,
	value,
	onValueChange,
	className,
	"aria-label": ariaLabel = "Metrics timeframe",
}: TimeframeToggleProps) {
	return (
		<ToggleGroup
			aria-label={ariaLabel}
			value={[value]}
			onValueChange={(next) => {
				const picked = next[0];
				if (picked && picked !== value) {
					onValueChange(picked as MetricsTimeframeChoice);
				}
			}}
			variant="outline"
			size="sm"
			className={cn("h-8", className)}
		>
			{timeframes.map((tf) => (
				<ToggleGroupItem key={tf} value={tf} aria-label={TIMEFRAME_LABELS[tf]}>
					{TIMEFRAME_LABELS[tf]}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
