"use client";

import { formatTimeAgo } from "@/lib/format";
import { TooltipWrapper } from "@/components/ui/tooltip";

export function TimeAgo({
	timestamp,
	className,
}: {
	timestamp: number;
	className?: string;
}) {
	const date = new Date(timestamp * 1000);
	const fullDate = date.toLocaleString();

	return (
		<TooltipWrapper content={fullDate}>
			<span className={className}>{formatTimeAgo(timestamp)}</span>
		</TooltipWrapper>
	);
}
