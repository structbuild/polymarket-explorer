"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePnlPeriodWindow } from "@/lib/hooks/use-pnl-period-window";
import { formatDateCompact, formatNumber } from "@/lib/format";
import type { PnlPeriodRecord, PnlPeriodWindow, PnlPeriods } from "@/lib/struct/pnl";
import { cn } from "@/lib/utils";

const PERIOD_WINDOWS: { value: PnlPeriodWindow; label: string }[] = [
	{ value: "day", label: "D" },
	{ value: "week", label: "W" },
	{ value: "month", label: "M" },
];

function formatPeriodRange(period: PnlPeriodRecord, window: PnlPeriodWindow) {
	if (window === "day") return formatDateCompact(period.from);
	const start = formatDateCompact(period.from);
	const end = formatDateCompact(period.to);
	return start === end ? start : `${start} – ${end}`;
}

function PeriodValue({
	period,
	window,
	tone,
}: {
	period: PnlPeriodRecord | null;
	window: PnlPeriodWindow;
	tone: "positive" | "negative";
}) {
	const isEmpty = !period || (tone === "positive" ? period.change <= 0 : period.change >= 0);
	const colorClassName = tone === "positive" ? "text-emerald-500" : "text-red-500";

	if (isEmpty) {
		return <span className="text-sm font-medium text-muted-foreground sm:text-base">—</span>;
	}

	return (
		<span className="text-sm font-medium sm:text-base">
			<span className={cn(colorClassName, "tabular-nums")}>
				{formatNumber(period.change, { currency: true, compact: true })}
			</span>
			<span className="font-normal text-muted-foreground">, {formatPeriodRange(period, window)}</span>
		</span>
	);
}

function PeriodLine({
	label,
	period,
	window,
	tone,
}: {
	label: string;
	period: PnlPeriodRecord | null;
	window: PnlPeriodWindow;
	tone: "positive" | "negative";
}) {
	return (
		<div className="flex items-baseline justify-between gap-3">
			<p className="text-sm text-foreground/90 sm:text-base">{label}</p>
			<div className="min-w-0 truncate text-right">
				<PeriodValue period={period} window={window} tone={tone} />
			</div>
		</div>
	);
}

export function PeriodRows({ periods }: { periods: PnlPeriods }) {
	const [window, setWindow] = usePnlPeriodWindow();
	const extremes = periods.totalPnl[window];

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<p className="text-sm text-muted-foreground sm:text-base">Period</p>
				<ToggleGroup
					aria-label="Period timeframe"
					value={[window]}
					onValueChange={(next) => {
						const picked = next[0] as PnlPeriodWindow | undefined;
						if (picked && picked !== window) setWindow(picked);
					}}
					variant="outline"
					size="sm"
					className="h-7"
				>
					{PERIOD_WINDOWS.map((entry) => (
						<ToggleGroupItem key={entry.value} value={entry.value} aria-label={entry.label}>
							{entry.label}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>
			<PeriodLine label="Best Period" period={extremes.best} window={window} tone="positive" />
			<PeriodLine label="Worst Period" period={extremes.worst} window={window} tone="negative" />
		</div>
	);
}
