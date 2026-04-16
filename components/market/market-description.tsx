"use client";

import { useState } from "react";
import { PlusIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MarketDescriptionProps = {
	text: string;
	className?: string;
};

export function MarketDescription({ text, className }: MarketDescriptionProps) {
	const [expanded, setExpanded] = useState(false);
	const isLong = text.length > 180;

	return (
		<div className={cn("space-y-2", className)}>
			<p
				className={cn(
					"text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
					!expanded && isLong && "line-clamp-2",
				)}
			>
				{text}
			</p>
			{isLong && (
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					className="inline-flex items-center gap-1 rounded-md bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
				>
					{expanded ? <MinusIcon className="size-3" /> : <PlusIcon className="size-3" />}
					{expanded ? "Show less" : "Show more"}
				</button>
			)}
		</div>
	);
}
