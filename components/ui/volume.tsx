"use client";

import type { ReactNode } from "react";

import { TooltipWrapper } from "@/components/ui/tooltip";
import { formatNumber } from "@/lib/format";
import { useVolumeMode, type VolumeMode } from "@/lib/hooks/use-volume-mode";
import { cn } from "@/lib/utils";

type VolumeProps = {
	usd: number | null | undefined;
	shares: number | null | undefined;
	compact?: boolean;
	decimals?: number;
	className?: string;
	fallback?: ReactNode;
	noTooltip?: boolean;
};

type FormatOptions = {
	compact?: boolean;
	decimals?: number;
};

export function formatVolumeValue(
	mode: VolumeMode,
	usd: number | null | undefined,
	shares: number | null | undefined,
	options: FormatOptions = {},
) {
	const { compact = true, decimals } = options;
	const value = mode === "usd" ? usd : shares;

	if (value == null || Number.isNaN(value)) return "—";

	return formatNumber(value, {
		compact,
		decimals,
		currency: mode === "usd",
	});
}

export function Volume({ usd, shares, compact = true, decimals, className, fallback, noTooltip }: VolumeProps) {
	const { mode } = useVolumeMode();

	const primary = mode === "usd" ? usd : shares;

	if (primary == null || Number.isNaN(primary)) {
		return <span className={cn("tabular-nums", className)}>{fallback ?? "—"}</span>;
	}

	const display = formatVolumeValue(mode, usd, shares, { compact, decimals });

	const node = (
		<span className={cn("tabular-nums", className)} aria-label={mode === "usd" ? "USD volume" : "Notional volume"}>
			{display}
		</span>
	);

	if (noTooltip) {
		return node;
	}

	const usdDisplay = formatVolumeValue("usd", usd, shares, { compact: true });
	const sharesDisplay = formatVolumeValue("notional", usd, shares, { compact: true });

	return (
		<TooltipWrapper
			content={
				<span className="flex flex-col gap-0.5 text-[11px] leading-tight">
					<span>
						<span className="text-background/70">USD</span> {usdDisplay}
					</span>
					<span>
						<span className="text-background/70">Notional</span> {sharesDisplay}
					</span>
				</span>
			}
		>
			{node}
		</TooltipWrapper>
	);
}
