import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnalyticsSection } from "@/components/analytics/analytics-section";
import { MarketCharts, MarketChartsFallback } from "@/components/market/market-charts";
import { MarketHeader } from "@/components/market/market-header";
import { MarketTabPanel } from "@/components/market/market-tab-panel";
import { RelatedMarkets } from "@/components/market/related-markets";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/env";
import { formatCapitalizeWords, formatNumber, slugify } from "@/lib/format";
import { buildMarketJsonLd } from "@/lib/market-json-ld";
import { loadMarketDetailSearchParams } from "@/lib/market-detail-search-params.server";
import { getMarketAnalyticsChanges, getMarketAnalyticsDeltas, getMarketAnalyticsTimeseries } from "@/lib/struct/analytics-queries";
import { getDefaultResolution, parseAnalyticsCap, parseAnalyticsRange, parseAnalyticsResolution, parseAnalyticsView } from "@/lib/struct/analytics-shared";
import { getMarketBySlug, getMarketsByTag } from "@/lib/struct/market-queries";
import { buildEntityPageTitle, buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import type { MarketResponse } from "@structbuild/sdk";

export const revalidate = 300;

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getLeadingOutcome(market: MarketResponse) {
	const outcomes = market.outcomes ?? [];
	if (outcomes.length === 0) return null;
	return outcomes.reduce((best, o) => ((o.price ?? 0) > (best.price ?? 0) ? o : best), outcomes[0]);
}

function getMarketVolume(market: MarketResponse): number {
	return market.metrics?.lifetime?.volume ?? 0;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		return {};
	}

	const leading = getLeadingOutcome(market);
	const probability = leading?.price != null ? (leading.price * 100).toFixed(0) : null;
	const volume = formatNumber(getMarketVolume(market), {
		compact: true,
		currency: true,
	});
	const holders = formatNumber(market.total_holders ?? 0, { decimals: 0 });
	const marketName = (market.question ?? market.title ?? "Prediction Market").trim();
	const marketNameNoPunct = marketName.replace(/[?.!,;:]+\s*$/u, "");
	const leadingOutcome = leading?.name ?? "Leading outcome";

	const shortOutcome = leadingOutcome && leadingOutcome.length <= 5 ? leadingOutcome : null;
	const titleDescriptor = probability
		? shortOutcome
			? `${probability}% ${shortOutcome} · Polymarket`
			: `${probability}% · Polymarket Odds`
		: "Polymarket Odds";

	const descriptionParts: string[] = [];
	if (probability) {
		descriptionParts.push(`${leadingOutcome} ${probability}%`);
	}
	descriptionParts.push(`${volume} volume`);
	descriptionParts.push(`${holders} holders`);
	const description = `${descriptionParts.join(" · ")}. Live Polymarket odds for: ${marketNameNoPunct}.`;

	return buildPageMetadata({
		title: buildEntityPageTitle(marketNameNoPunct, titleDescriptor),
		description,
		canonical: `/markets/${slug}`,
		openGraph: {
			type: "article",
			images: [
				{
					url: `/markets/${slug}/opengraph-image`,
					width: 1200,
					height: 630,
				},
			],
		},
		twitter: {
			images: [`/markets/${slug}/opengraph-image`],
		},
	});
}

function truncateQuestion(question: string, maxLength: number = 60) {
	if (question.length <= maxLength) return question;
	return `${question.slice(0, maxLength)}…`;
}

export default async function MarketPage({ params, searchParams }: Props) {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		notFound();
	}

	const [{ tab, tradesPage }, resolvedSearchParams] = await Promise.all([loadMarketDetailSearchParams(searchParams), searchParams]);
	const view = parseAnalyticsView(resolvedSearchParams.view);
	const range = view === "cumulative" ? "all" : parseAnalyticsRange(resolvedSearchParams.range);
	const resolution = parseAnalyticsResolution(resolvedSearchParams.resolution, range);
	const defaultResolution = getDefaultResolution(range);
	const endTime = typeof market.end_time === "number" && Number.isFinite(market.end_time) ? market.end_time : undefined;
	const isResolved = market.status === "closed" || market.status === "resolved";
	const defaultCap = isResolved && endTime !== undefined;
	const cap = parseAnalyticsCap(resolvedSearchParams.cap) ?? defaultCap;
	const breadcrumbTag = market.tags?.length ? market.tags[0] : null;
	const conditionId = market.condition_id ?? null;

	const siteUrl = getSiteUrl();
	const marketUrl = new URL(`/markets/${slug}`, siteUrl).toString();
	const marketJsonLd = buildMarketJsonLd({
		market,
		url: marketUrl,
		siteName: SITE_NAME,
		imageUrl: market.image_url ?? undefined,
	});

	const relatedMarketsPromise = breadcrumbTag
		? getMarketsByTag(breadcrumbTag, 8, undefined, "volume", "desc", isResolved ? "all" : "open")
		: null;

	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-4 px-4 pb-10 sm:gap-6 sm:px-6 sm:pb-12">
				<Breadcrumbs
					items={[
						{ label: "Home", href: "/" },
						{ label: "Markets", href: "/markets" },
						...(breadcrumbTag ? [{ label: formatCapitalizeWords(breadcrumbTag), href: `/tags/${slugify(breadcrumbTag)}` as string }] : []),
						{
							label: truncateQuestion(market.question ?? market.title ?? slug),
							href: `/markets/${slug}`,
						},
					]}
				/>

				<JsonLd data={marketJsonLd} />

				<MarketHeader market={market} slug={slug} />

				{conditionId && (
					<>
						<Suspense fallback={<MarketChartsFallback />}>
							<MarketCharts conditionId={conditionId} />
						</Suspense>
						<MarketTabPanel currentTab={tab} slug={slug} conditionId={conditionId} tradesPage={tradesPage} />
						<div className="mt-8">
							<AnalyticsSection
								title="Analytics"
								range={range}
								view={view}
								resolution={resolution}
								defaultResolution={defaultResolution}
								endTime={endTime}
								cap={cap}
								defaultCap={defaultCap}
								pathname={`/markets/${slug}`}
								fetchers={{
									deltas: () => getMarketAnalyticsDeltas(conditionId, range, resolution),
									timeseries: () => getMarketAnalyticsTimeseries(conditionId, range, resolution),
									changes: () => getMarketAnalyticsChanges(conditionId, range),
								}}
							/>
						</div>
					</>
				)}

				{breadcrumbTag && relatedMarketsPromise && (
					<Suspense>
						<RelatedMarketsSection
							relatedPromise={relatedMarketsPromise}
							tag={breadcrumbTag}
							currentSlug={slug}
						/>
					</Suspense>
				)}
			</div>
		</div>
	);
}

async function RelatedMarketsSection({
	relatedPromise,
	tag,
	currentSlug,
}: {
	relatedPromise: ReturnType<typeof getMarketsByTag>;
	tag: string;
	currentSlug: string;
}) {
	const { data } = await relatedPromise;
	return <RelatedMarkets markets={data} tag={tag} currentSlug={currentSlug} />;
}
