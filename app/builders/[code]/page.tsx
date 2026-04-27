import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { BuilderLatestRow } from "@structbuild/sdk";

import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { BuilderConcentrationCard } from "@/components/builders/builder-concentration-card";
import { BuilderFeeHistory } from "@/components/builders/builder-fee-history";
import { BuilderRetentionHeatmap } from "@/components/builders/builder-retention-heatmap";
import { BuilderStatsRow } from "@/components/builders/builder-stats-row";
import { BuilderTagBreakdown } from "@/components/builders/builder-tag-breakdown";
import { BuilderPageHeading } from "@/components/builders/builder-page-heading";
import { BuilderTopTraders } from "@/components/builders/builder-top-traders";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/env";
import { formatNumber } from "@/lib/format";
import { buildEntityPageTitle, buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { formatBuilderCodeDisplay } from "@/lib/utils";
import {
	getBuilderAnalyticsChanges,
	getBuilderAnalyticsDeltas,
	getBuilderAnalyticsTimeseries,
} from "@/lib/struct/analytics-queries";
import { parseAnalyticsParams } from "@/lib/struct/analytics-shared";
import {
	getAllBuilderCodes,
	getBuilderByCode,
	getBuilderConcentration,
	getBuilderFees,
	getBuilderFeesHistory,
	getBuilderRetention,
	getBuilderTags,
	getBuilderTopTraders,
} from "@/lib/struct/builder-queries";

const BUILDER_CODE_PLACEHOLDER = "__placeholder__";

type Props = {
	params: Promise<{ code: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
	const codes = (await getAllBuilderCodes(10)).map(({ code }) => code);
	if (codes.length > 0) {
		return codes.map((code) => ({ code }));
	}
	return [{ code: BUILDER_CODE_PLACEHOLDER }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { code } = await params;
	const builder = await getBuilderByCode(code);

	if (!builder) {
		return {};
	}

	const volume =
		builder.volume_usd > 0
			? formatNumber(builder.volume_usd, { compact: true, currency: true })
			: null;
	const traders =
		builder.unique_traders > 0
			? formatNumber(builder.unique_traders, { decimals: 0 })
			: null;
	const isEmpty = builder.volume_usd === 0 && builder.txn_count === 0;

	const stats: string[] = [];
	if (volume) stats.push(`${volume} volume`);
	if (traders) stats.push(`${traders} traders`);
	const descriptionStats = stats.length ? `${stats.join(", ")}. ` : "";
	const codeLabel = formatBuilderCodeDisplay(code);

	return buildPageMetadata({
		title: buildEntityPageTitle(codeLabel, "Polymarket Builder"),
		description: `Builder ${codeLabel} on Polymarket. ${descriptionStats}Routing volume, fees earned, top traders, retention, and tag breakdown.`,
		canonical: `/builders/${encodeURIComponent(code)}`,
		...(isEmpty && { robots: { index: false, follow: true } }),
	});
}

export default async function BuilderPage({ params, searchParams }: Props) {
	const { code } = await params;
	const builder = await getBuilderByCode(code);

	if (!builder) {
		notFound();
	}

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Suspense fallback={<BuilderPageFallback code={code} />}>
				<BuilderPageContent code={code} builder={builder} searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function BuilderPageContent({
	builder,
	code,
	searchParams,
}: {
	builder: BuilderLatestRow;
	code: string;
	searchParams: Props["searchParams"];
}) {
	const resolved = await searchParams;
	const { view, range, resolution, defaultResolution, defaultRange } = parseAnalyticsParams(
		resolved,
		"scoped",
		"30d",
	);

	const [fees, concentration, retention, topTraders, tagBreakdown, feeHistory] = await Promise.all([
		getBuilderFees(code),
		getBuilderConcentration(code, "30d"),
		getBuilderRetention(code),
		getBuilderTopTraders(code, "volume", "lifetime", 25),
		getBuilderTags(code, "volume", "lifetime", 12),
		getBuilderFeesHistory(code, 25),
	]);

	const siteUrl = getSiteUrl();
	const builderCode = builder.builder_code;
	const codeLabel = formatBuilderCodeDisplay(builderCode);
	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "Thing",
		name: `${codeLabel} — ${SITE_NAME}`,
		description: `Polymarket builder ${codeLabel} routing stats and analytics.`,
		url: new URL(`/builders/${encodeURIComponent(builderCode)}`, siteUrl).toString(),
	};

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Builders", href: "/builders" },
					{ label: codeLabel, href: `/builders/${encodeURIComponent(builderCode)}` },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-8">
				<div className="flex flex-col gap-6">
					<BuilderPageHeading builderCode={builderCode} />
					<BuilderStatsRow row={builder} fees={fees} />
				</div>

				<AnalyticsSection
					title="Analytics"
					range={range}
					view={view}
					resolution={resolution}
					defaultResolution={defaultResolution}
					defaultRange={defaultRange}
					pathname={`/builders/${encodeURIComponent(builderCode)}`}
					fetchers={{
						deltas: () => getBuilderAnalyticsDeltas(code, range, resolution),
						timeseries: () => getBuilderAnalyticsTimeseries(code, range, resolution),
						changes: () => getBuilderAnalyticsChanges(code, range),
					}}
				/>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<BuilderConcentrationCard data={concentration} />
					<BuilderTagBreakdown rows={tagBreakdown} />
				</div>

				<BuilderTopTraders rows={topTraders} />

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<BuilderRetentionHeatmap rows={retention} />
					<BuilderFeeHistory entries={feeHistory} />
				</div>
			</div>
		</>
	);
}

function BuilderPageFallback({ code }: { code: string }) {
	return (
		<div className="mt-6 space-y-6">
			<div>
				<div className="text-foreground/40">
					<BuilderPageHeading builderCode={code} />
				</div>
				<div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
				<div className="mt-3 h-4 w-96 animate-pulse rounded bg-muted" />
			</div>
			<div className="h-64 rounded-lg bg-card" />
		</div>
	);
}
