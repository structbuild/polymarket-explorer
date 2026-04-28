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
	const displayTimeAgo = formatTimeAgo(timestamp);
	const displayDate = new Date(timestamp * 1000).toLocaleString();

	return (
		<TooltipWrapper content={displayDate}>
			<span className={className} suppressHydrationWarning>
				{displayTimeAgo}
			</span>
		</TooltipWrapper>
	);
}
