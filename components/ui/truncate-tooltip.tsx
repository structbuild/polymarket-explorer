"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function TruncateTooltip({ children, className }: { children: ReactNode; className?: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const [overflowing, setOverflowing] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const check = () => setOverflowing(el.scrollWidth > el.clientWidth);
		check();
		const observer = new ResizeObserver(check);
		observer.observe(el);
		return () => observer.disconnect();
	}, [children]);

	return (
		<Tooltip open={overflowing && open} onOpenChange={setOpen}>
			<TooltipTrigger
				render={
					<div ref={ref} className={cn("min-w-0 truncate", className)}>
						{children}
					</div>
				}
			/>
			<TooltipContent>{children}</TooltipContent>
		</Tooltip>
	);
}
