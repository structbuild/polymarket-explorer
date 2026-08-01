"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
	getAnalyticsSectionChangesAction,
	getAnalyticsSectionDataAction,
} from "@/app/actions";
import {
	AnalyticsSectionClient,
	type AnalyticsSectionClientProps,
} from "@/components/analytics/analytics-section-client";
import type { AnalyticsSectionData } from "@/lib/struct/analytics-section-data";
import {
	ANALYTICS_PREVIEW_EXCLUDED_METRICS,
	type AnalyticsRange,
	type AnalyticsResolution,
	type AnalyticsView,
} from "@/lib/struct/analytics-shared";

type Props = Omit<AnalyticsSectionClientProps, "initialData" | "refreshedAt"> & {
	previewData: AnalyticsSectionData;
	previewRefreshedAt: string;
	range: AnalyticsRange;
	resolution: AnalyticsResolution;
	view: AnalyticsView;
	preloadAnchorId?: string;
};

export function ProgressiveAnalyticsSectionClient({
	previewData,
	previewRefreshedAt,
	range,
	resolution,
	view,
	preloadAnchorId,
	...sectionProps
}: Props) {
	const containerRef = useRef<HTMLDivElement>(null);
	const requestedRef = useRef(false);
	const [fullData, setFullData] = useState<AnalyticsSectionData | null>(null);
	const [isPending, startTransition] = useTransition();
	const {
		source,
		defaultRange,
		showKpis,
		excludeMetrics,
		appendMetrics,
		allowedComponents,
	} = sectionProps;

	const loadFullData = useCallback(() => {
		if (requestedRef.current || fullData) return;
		requestedRef.current = true;

		startTransition(async () => {
			try {
				const canReusePreview = view === "deltas" && range === "30d" && resolution === "D";
				const result = canReusePreview
					? {
							...previewData,
							kpiPoints: showKpis ? previewData.chartPoints : null,
							changes: showKpis
								? await getAnalyticsSectionChangesAction({ source, range, defaultRange })
								: null,
						}
					: await getAnalyticsSectionDataAction({
							source,
							range,
							resolution,
							view,
							defaultRange,
							showKpis,
							excludeMetrics,
							appendMetrics,
							allowedComponents,
						});
				setFullData(result);
			} catch (error) {
				requestedRef.current = false;
				console.error("Failed to progressively load analytics section data", error);
			}
		});
	}, [allowedComponents, appendMetrics, defaultRange, excludeMetrics, fullData, previewData, range, resolution, showKpis, source, view]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || fullData || requestedRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				loadFullData();
			},
			{ rootMargin: "600px 0px" },
		);

		observer.observe(container);
		return () => observer.disconnect();
	}, [fullData, loadFullData]);

	useEffect(() => {
		if (!preloadAnchorId || fullData) return;
		const navigationTargets = document.querySelectorAll<HTMLElement>(
			`[data-section-target="${preloadAnchorId}"]`,
		);
		const preload = () => loadFullData();

		for (const target of navigationTargets) {
			target.addEventListener("pointerenter", preload, { passive: true });
			target.addEventListener("focus", preload, { passive: true });
			target.addEventListener("click", preload, { passive: true });
		}

		return () => {
			for (const target of navigationTargets) {
				target.removeEventListener("pointerenter", preload);
				target.removeEventListener("focus", preload);
				target.removeEventListener("click", preload);
			}
		};
	}, [fullData, loadFullData, preloadAnchorId]);

	return (
		<div
			ref={containerRef}
			onPointerEnter={loadFullData}
			onFocusCapture={loadFullData}
			aria-busy={isPending}
		>
			{fullData ? (
				<AnalyticsSectionClient
					{...sectionProps}
					initialData={fullData}
					refreshedAt={new Date().toISOString()}
				/>
			) : (
				<AnalyticsSectionClient
					{...sectionProps}
					initialData={previewData}
					refreshedAt={previewRefreshedAt}
					excludeMetrics={ANALYTICS_PREVIEW_EXCLUDED_METRICS}
					appendMetrics={undefined}
					metricPlacements={undefined}
					showControls={false}
					showKpis={false}
				/>
			)}
		</div>
	);
}
