import type { Metadata } from "next";

import { EventCard } from "@/components/event/event-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getTopEvents } from "@/lib/struct/market-queries";

export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
	title: "Prediction Market Events",
	description: "Browse active Polymarket events with live odds, volume, liquidity, and related markets.",
	canonical: "/events",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EventsPage({ searchParams }: Props) {
	const resolvedSearchParams = await searchParams;
	const cursor = typeof resolvedSearchParams.cursor === "string" ? resolvedSearchParams.cursor : undefined;
	const { data: events, hasMore, nextCursor } = await getTopEvents(24, "open", cursor);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Events — ${SITE_NAME}`,
		description: `Browse active prediction market events sorted by volume on ${SITE_NAME}.`,
		url: new URL("/events", siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: events.length,
			itemListElement: events.map((event, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: event.title ?? "Untitled event",
				url: event.event_slug ? new URL(`/event/${event.event_slug}`, siteUrl).toString() : undefined,
			})),
		},
	};

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Events", href: "/events" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6">
				<h1 className="text-xl font-medium tracking-tight">Events</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Browse active prediction market events sorted by volume.
				</p>
			</div>

			<div className="mt-8 grid gap-4 sm:grid-cols-2">
				{events.map((event) => (
					<EventCard
						key={event.id}
						slug={event.event_slug ?? null}
						title={event.title ?? null}
						imageUrl={event.image_url ?? null}
						marketCount={event.market_count}
						volume24hUsd={event.metrics?.["24h"]?.volume ?? null}
						status={event.status}
						endTime={event.end_time ?? null}
					/>
				))}
			</div>
			<PaginationNav
				basePath="/events"
				cursor={cursor ?? null}
				nextCursor={nextCursor}
				hasMore={hasMore}
			/>
		</div>
	);
}
