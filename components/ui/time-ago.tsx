"use client";

import { useEffect, useState } from "react";
import { formatTimeAgo } from "@/lib/format";
import { TooltipWrapper } from "@/components/ui/tooltip";

export function TimeAgo({
	timestamp,
	className,
}: {
	timestamp: number;
	className?: string;
}) {
	const [displayTimeAgo, setDisplayTimeAgo] = useState("");
	const [displayDate, setDisplayDate] = useState("");

	useEffect(() => {
		setDisplayTimeAgo(formatTimeAgo(timestamp));
		setDisplayDate(new Date(timestamp * 1000).toLocaleString());
	}, [timestamp]);

	return (
		<TooltipWrapper content={displayDate}>
			<span className={className} suppressHydrationWarning>
				{displayTimeAgo}
			</span>
		</TooltipWrapper>
	);
}
