"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { getTraderRankedPositionsPageAction } from "@/app/actions";
import { TraderHighlightsClient } from "@/components/trader/trader-highlights-client";
import type { TraderExitMode } from "@/lib/trader-search-params-shared";

function HighlightsFallback() {
	return (
		<div className="space-y-3">
			<div className="h-7 w-48 animate-pulse rounded-sm bg-muted" />
			<div className="overflow-hidden rounded-lg bg-card">
				<div className="grid gap-px bg-border">
					{Array.from({ length: 6 }, (_, index) => (
						<div key={index} className="flex items-center gap-4 bg-card px-4 py-3">
							<div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
							<div className="min-w-0 flex-1 space-y-2">
								<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
								<div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
							</div>
							<div className="h-4 w-24 animate-pulse rounded bg-muted" />
							<div className="hidden h-4 w-16 animate-pulse rounded bg-muted md:block" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

type HighlightsData = Awaited<ReturnType<typeof getTraderRankedPositionsPageAction>>;

export function DeferredTraderHighlights({
	address,
	mode,
	pageNumber,
}: {
	address: string;
	mode: TraderExitMode;
	pageNumber: number;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const requestedRef = useRef(false);
	const [data, setData] = useState<HighlightsData | null>(null);
	const [, startTransition] = useTransition();

	const load = useCallback(() => {
		if (requestedRef.current || data) return;
		requestedRef.current = true;
		startTransition(async () => {
			try {
				const result = await getTraderRankedPositionsPageAction({ address, mode, pageNumber });
				setData(result);
			} catch (error) {
				requestedRef.current = false;
				console.error("Failed to load trader highlights", error);
			}
		});
	}, [address, data, mode, pageNumber]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || data || requestedRef.current) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				load();
			},
			{ rootMargin: "600px 0px" },
		);
		observer.observe(container);
		return () => observer.disconnect();
	}, [data, load]);

	useEffect(() => {
		const targets = document.querySelectorAll<HTMLElement>(
			'[data-section-target="trader-highlights"]',
		);
		for (const target of targets) {
			target.addEventListener("pointerenter", load, { passive: true });
			target.addEventListener("focus", load, { passive: true });
		}
		return () => {
			for (const target of targets) {
				target.removeEventListener("pointerenter", load);
				target.removeEventListener("focus", load);
			}
		};
	}, [load]);

	return (
		<div ref={containerRef} onPointerEnter={load} onFocusCapture={load}>
			{data ? (
				<TraderHighlightsClient
					address={address}
					initialMode={mode}
					initialPage={data.page}
					initialPageNumber={data.pageNumber}
				/>
			) : (
				<HighlightsFallback />
			)}
		</div>
	);
}
