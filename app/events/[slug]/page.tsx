import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { EventHeader, EventHeaderFallback } from "@/components/event/event-header";
import { EventMarketsTable } from "@/components/event/event-markets-table";
import { EventOverviewChart, EventOverviewChartFallback } from "@/components/event/event-overview-chart";
import { EventTrades, EventTradesFallback } from "@/components/event/event-trades";
import { AnchorSectionNav } from "@/components/layout/anchor-section-nav";
import { SectionAnchor } from "@/components/layout/section-anchor";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteUrl } from "@/lib/env";
import { formatCapitalizeWords, formatNumber, slugify } from "@/lib/format";
import { buildEntityPageTitle, buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getEventBySlug, getEventMetrics } from "@/lib/struct/queries/events";

type Props = {
	params: Promise<{ slug: string }>;
};

function truncateTitle(title: string, maxLength: number = 60) {
	if (title.length <= maxLength) return title;
	return `${title.slice(0, maxLength)}…`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const event = await getEventBySlug(slug);

	if (!event) {
		return {};
	}

	const title = (event.title ?? slug.replace(/-/g, " ")).trim();
	const titleNoPunct = title.replace(/[?.!,;:]+\s*$/u, "");
	const marketCount = event.market_count ?? event.markets?.length ?? 0;
	const lifetimeVolume = event.metrics?.lifetime?.volume ?? null;

	const descriptionParts: string[] = [];
	descriptionParts.push(`${formatNumber(marketCount, { decimals: 0 })} ${marketCount === 1 ? "market" : "markets"}`);
	if (lifetimeVolume != null && lifetimeVolume > 0) {
		descriptionParts.push(`${formatNumber(lifetimeVolume, { compact: true, currency: true })} volume`);
	}
	const descriptor = descriptionParts.join(" · ");
	const description = `${descriptor}. Live Polymarket event with grouped markets: ${titleNoPunct}.`;

	return buildPageMetadata({
		title: buildEntityPageTitle(titleNoPunct, "Polymarket Event"),
		description,
		canonical: `/events/${slug}`,
		openGraph: {
			type: "article",
			images: [
				{
					url: `/events/${slug}/opengraph-image`,
					width: 1200,
					height: 630,
				},
			],
		},
		twitter: {
			images: [`/events/${slug}/opengraph-image`],
		},
	});
}

export default function EventPage({ params }: Props) {
	return (
		<Suspense fallback={<EventPageFallback />}>
			<EventPageContent params={params} />
		</Suspense>
	);
}

async function EventPageContent({ params }: { params: Props["params"] }) {
	await connection();

	const { slug } = await params;
	const [event, metrics] = await Promise.all([
		getEventBySlug(slug),
		getEventMetrics(slug, "lifetime"),
	]);

	if (!event) {
		notFound();
	}

	const siteUrl = getSiteUrl();
	const eventUrl = new URL(`/events/${slug}`, siteUrl).toString();
	const breadcrumbTag = event.tags && event.tags.length > 0 ? event.tags[0].label : null;
	const childMarkets = event.markets ?? [];

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: event.title ?? slug,
		description: event.description ?? undefined,
		url: eventUrl,
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: childMarkets.length,
			itemListElement: childMarkets
				.filter((m) => m.market_slug)
				.map((m, index) => ({
					"@type": "ListItem",
					position: index + 1,
					name: m.question || m.title || m.market_slug,
					url: new URL(`/markets/${m.market_slug}`, siteUrl).toString(),
				})),
		},
	};

	const sectionNavItems = [
		{ id: "event-overview", label: "Overview" },
		...(event.event_slug && childMarkets.length > 0
			? [{ id: "event-probability", label: "Probability" }]
			: []),
		{ id: "event-markets", label: "Markets" },
		...(event.event_slug ? [{ id: "event-top-traders", label: "Top traders" }] : []),
		...(childMarkets.length > 0 ? [{ id: "event-trades", label: "Recent trades" }] : []),
	];

	return (
		<>
			<AnchorSectionNav items={sectionNavItems} />
			<div className="flex w-full justify-center">
				<div className="flex w-full max-w-7xl flex-col gap-4 px-4 pt-4 pb-10 sm:gap-6 sm:px-6 sm:pt-6 sm:pb-12">
					<Breadcrumbs
						items={[
							{ label: "Home", href: "/" },
							{ label: "Events", href: "/events" },
							...(breadcrumbTag
								? [{ label: formatCapitalizeWords(breadcrumbTag), href: `/tags/${slugify(breadcrumbTag)}` as string }]
								: []),
							{
								label: truncateTitle(event.title ?? slug),
								href: `/events/${slug}`,
							},
						]}
					/>

					<JsonLd data={jsonLd} />

					<SectionAnchor id="event-overview">
						<EventHeader event={event} slug={slug} metrics={metrics} />
					</SectionAnchor>

					{event.event_slug && childMarkets.length > 0 && (
						<SectionAnchor id="event-probability">
							<Suspense fallback={<EventOverviewChartFallback />}>
								<EventOverviewChart event={event} />
							</Suspense>
						</SectionAnchor>
					)}

					<SectionAnchor id="event-markets">
						<EventMarketsTable markets={childMarkets} />
					</SectionAnchor>

					{childMarkets.length > 0 && (
						<SectionAnchor id="event-trades">
							<Suspense fallback={<EventTradesFallback />}>
								<EventTrades markets={childMarkets} />
							</Suspense>
						</SectionAnchor>
					)}

					<p className="sr-only">{`${SITE_NAME} event detail page for ${event.title ?? slug}`}</p>
				</div>
			</div>
		</>
	);
}

function EventPageFallback() {
	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-4 px-4 pt-4 pb-10 sm:gap-6 sm:px-6 sm:pt-6 sm:pb-12">
				<div className="space-y-4">
					<EventHeaderFallback />
					<div className="h-64 rounded-lg bg-card" />
				</div>
			</div>
		</div>
	);
}
