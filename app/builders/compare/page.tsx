import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import {
	BuilderComparePicker,
	type CompareSelectedBuilder,
} from "@/components/builders/compare/builder-compare-picker";
import { CompareConcentration } from "@/components/builders/compare/compare-concentration";
import { CompareMetricsTable } from "@/components/builders/compare/compare-metrics-table";
import { CompareTags } from "@/components/builders/compare/compare-tags";
import { CompareTimeseries } from "@/components/builders/compare/compare-timeseries";
import { AnchorSectionNav, type AnchorNavItem } from "@/components/layout/anchor-section-nav";
import { SectionAnchor } from "@/components/layout/section-anchor";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { loadBuilderCompareSearchParams } from "@/lib/builder-compare-search-params.server";
import { MAX_COMPARE_BUILDERS } from "@/lib/builder-compare-search-params-shared";
import { COMPARE_ACTIVITY_METRICS } from "@/lib/builder-compare-activity";
import { COMPARE_METRICS } from "@/lib/builder-compare-metrics";
import { buildPageMetadata } from "@/lib/site-metadata";
import {
	getCompareCandidateBuilders,
	loadBuilderCompare,
	type CompareBuilder,
	type CompareCandidateBuilder,
} from "@/lib/struct/builder-compare";

const CONCENTRATION_SKELETON_COUNT = 3;

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const NAV_ITEMS: AnchorNavItem[] = [
	{ id: "compare-metrics", label: "Metrics" },
	{ id: "compare-activity", label: "Activity" },
	{ id: "compare-concentration", label: "Concentration" },
	{ id: "compare-tags", label: "Tags" },
];

export const metadata: Metadata = buildPageMetadata({
	title: "Compare Polymarket Builders",
	description: `Compare up to ${MAX_COMPARE_BUILDERS} Polymarket builders side by side: volume, builder fees, traders, trader concentration, category focus, and activity over time.`,
	canonical: "/builders/compare",
	robots: { index: false, follow: true },
});

const BREADCRUMBS = [
	{ label: "Home", href: "/" },
	{ label: "Builders", href: "/builders" },
	{ label: "Compare", href: "/builders/compare" },
];

function toSelected(builders: CompareBuilder[]): CompareSelectedBuilder[] {
	return builders.map((builder) => ({
		code: builder.code,
		displayName: builder.displayName,
		iconUrl: builder.row.metadata?.icon_url ?? null,
		color: builder.color,
	}));
}

function SectionHeading({ children }: { children: React.ReactNode }) {
	return <h2 className="mb-3 text-base font-medium text-foreground/90">{children}</h2>;
}

export default function BuilderComparePage({ searchParams }: Props) {
	return (
		<Suspense fallback={<CompareFallback />}>
			<CompareContent searchParams={searchParams} />
		</Suspense>
	);
}

async function CompareContent({ searchParams }: Props) {
	await connection();

	const { codes, timeframe } = await loadBuilderCompareSearchParams(searchParams);

	const defaultBuilders = await getCompareCandidateBuilders(timeframe);

	if (codes.length === 0) {
		return (
			<PageShell>
				<EmptyState
					codes={[]}
					selected={[]}
					timeframe={timeframe}
					defaultBuilders={defaultBuilders}
				/>
			</PageShell>
		);
	}

	const { builders, missing, resolution, activity } = await loadBuilderCompare({
		codes,
		timeframe,
	});
	const selected = toSelected(builders);

	if (builders.length < 2) {
		return (
			<PageShell>
				<EmptyState
					codes={codes}
					selected={selected}
					timeframe={timeframe}
					missing={missing}
					defaultBuilders={defaultBuilders}
				/>
			</PageShell>
		);
	}

	return (
		<>
			<AnchorSectionNav items={NAV_ITEMS} />
			<PageShell>
				<Breadcrumbs items={BREADCRUMBS} />
				<div className="mt-6 space-y-6">
					<div className="space-y-4">
						<h1 className="text-2xl font-medium">Compare builders</h1>
						<BuilderComparePicker
							codes={codes}
							selected={selected}
							timeframe={timeframe}
							defaultBuilders={defaultBuilders}
						/>
					</div>

					{missing.length > 0 ? <MissingNotice missing={missing} /> : null}

					<SectionAnchor id="compare-metrics">
						<SectionHeading>Headline metrics</SectionHeading>
						<CompareMetricsTable builders={builders} />
					</SectionAnchor>

					<SectionAnchor id="compare-activity">
						<SectionHeading>Activity per bucket</SectionHeading>
						<CompareTimeseries activity={activity} resolution={resolution} />
					</SectionAnchor>

					<SectionAnchor id="compare-concentration">
						<SectionHeading>Trader concentration</SectionHeading>
						<CompareConcentration builders={builders} />
					</SectionAnchor>

					<SectionAnchor id="compare-tags">
						<CompareTags builders={builders} />
					</SectionAnchor>
				</div>
			</PageShell>
		</>
	);
}

function PageShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
	);
}

function MissingNotice({ missing }: { missing: string[] }) {
	return (
		<p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
			Couldn&apos;t find {missing.length === 1 ? "builder" : "builders"}:{" "}
			<span className="font-mono text-foreground">{missing.join(", ")}</span>
		</p>
	);
}

function EmptyState({
	codes,
	selected,
	timeframe,
	missing,
	defaultBuilders,
}: {
	codes: string[];
	selected: CompareSelectedBuilder[];
	timeframe: Awaited<ReturnType<typeof loadBuilderCompareSearchParams>>["timeframe"];
	missing?: string[];
	defaultBuilders: CompareCandidateBuilder[];
}) {
	const needsMore = selected.length === 1;
	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Breadcrumbs items={BREADCRUMBS} />
			<div className="space-y-2">
				<h1 className="text-2xl font-medium">Compare builders</h1>
				<p className="text-sm text-muted-foreground">
					{needsMore
						? "Add at least one more builder to start comparing."
						: `Pick 2–${MAX_COMPARE_BUILDERS} builders to compare side by side.`}
				</p>
			</div>
			<BuilderComparePicker
				codes={codes}
				selected={selected}
				timeframe={timeframe}
				defaultBuilders={defaultBuilders}
			/>
			{missing && missing.length > 0 ? <MissingNotice missing={missing} /> : null}
		</div>
	);
}

function SkeletonHeading() {
	return <div className="h-5 w-36 animate-pulse rounded bg-muted" />;
}

function SkeletonChartCard({ bodyClassName }: { bodyClassName?: string }) {
	return (
		<div className="rounded-lg border border-border/60 bg-card p-4 sm:p-6">
			<div className="mb-4 h-4 w-28 animate-pulse rounded bg-muted" />
			<div
				className={`animate-pulse rounded-md bg-muted/60 ${
					bodyClassName ?? "h-[240px] sm:h-[300px]"
				}`}
			/>
		</div>
	);
}

function CompareFallback() {
	return (
		<PageShell>
			<div className="h-4 w-40 animate-pulse rounded bg-muted" />
			<div className="mt-6 space-y-6">
				<div className="space-y-4">
					<div className="h-8 w-56 animate-pulse rounded bg-muted" />
					<div className="flex flex-wrap items-center gap-2">
						{Array.from({ length: 2 }, (_, index) => (
							<div key={index} className="h-9 w-36 animate-pulse rounded-full bg-muted" />
						))}
						<div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
					</div>
					<div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
				</div>

				<div className="space-y-3">
					<SkeletonHeading />
					<div className="overflow-hidden rounded-lg border border-border/60 bg-card">
						<div className="border-b border-border/60 px-3 py-2.5">
							<div className="h-4 w-full max-w-sm animate-pulse rounded bg-muted" />
						</div>
						{Array.from({ length: COMPARE_METRICS.length }, (_, index) => (
							<div key={index} className="border-b border-border/40 px-3 py-2.5 last:border-0">
								<div className="h-4 w-full animate-pulse rounded bg-muted/60" />
							</div>
						))}
					</div>
				</div>

				<div className="space-y-3">
					<SkeletonHeading />
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
						{Array.from({ length: COMPARE_ACTIVITY_METRICS.length }, (_, index) => (
							<SkeletonChartCard key={index} />
						))}
					</div>
				</div>

				<div className="space-y-3">
					<SkeletonHeading />
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{Array.from({ length: CONCENTRATION_SKELETON_COUNT }, (_, index) => (
							<SkeletonChartCard key={index} bodyClassName="h-[320px]" />
						))}
					</div>
				</div>

				<SkeletonChartCard bodyClassName="h-[320px]" />
			</div>
		</PageShell>
	);
}
