"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import posthog from "posthog-js";

import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 600;

export function BackToTop() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const scrollToTop = useCallback(() => {
		posthog.capture("back_to_top_clicked", { scroll_y: Math.round(window.scrollY) });
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center sm:bottom-6">
			<button
				type="button"
				onClick={scrollToTop}
				aria-label="Back to top"
				aria-hidden={!visible}
				tabIndex={visible ? 0 : -1}
				className={cn(
					"pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-popover/90 px-4 py-2 text-xs font-medium text-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm transition-all duration-300 hover:bg-popover hover:ring-foreground/20 motion-reduce:transition-none",
					visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
				)}
			>
				<ArrowUpIcon className="size-3.5" />
				Back to top
			</button>
		</div>
	);
}
