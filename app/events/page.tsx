import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { EVENT_SKELETON_COLUMNS } from "@/components/event/events-table-columns";
import { EventsStatusListing } from "@/components/event/event-status-listing";
import { EventTagsScroller } from "@/components/event/event-tags-scroller";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { eventResponseToRow } from "@/lib/event-table-map";
import { getSiteUrl } from "@/lib/env";
import { buildPageMetadata, SITE_NAME } from "@/lib/site-metadata";
import { getTopEvents } from "@/lib/struct/queries/events";
import { loadEventSearchParams } from "@/lib/event-search-params.server";

export const metadata: Metadata = buildPageMetadata({
	title: "Polymarket Events · Browse by Volume",
	description:
		"Every active Polymarket event with grouped markets. Sort by volume, traders, and trade count to find the most active prediction markets.",
	canonical: "/events",
});

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function EventsPage({ searchParams }: Props) {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<Suspense fallback={<EventsPageFallback />}>
				<EventsPageContent searchParams={searchParams} />
			</Suspense>
		</div>
	);
}

async function EventsPageContent({ searchParams }: Props) {
	await connection();

	const { sort_by, sort_dir, timeframe, tab, cursor } = await loadEventSearchParams(searchParams);
	const activeCursor = cursor || undefined;
	const { data: events, hasMore, nextCursor } = await getTopEvents(
		24,
		tab,
		activeCursor,
		sort_by,
		sort_dir,
		timeframe,
	);
	const siteUrl = getSiteUrl();

	const jsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Events — ${SITE_NAME}`,
		description: `Browse active prediction-market events sorted by volume on ${SITE_NAME}.`,
		url: new URL("/events", siteUrl).toString(),
		mainEntity: {
			"@type": "ItemList",
			numberOfItems: events.length,
			itemListElement: events.map((event, index) => ({
				"@type": "ListItem",
				position: index + 1,
				name: event.title ?? "Untitled Event",
				url: event.event_slug
					? new URL(`/events/${event.event_slug}`, siteUrl).toString()
					: undefined,
			})),
		},
	};

	return (
		<>
			<Breadcrumbs
				items={[
					{ label: "Home", href: "/" },
					{ label: "Events", href: "/events" },
				]}
			/>
			<JsonLd data={jsonLd} />

			<div className="mt-6 space-y-4">
				<div>
					<h1 className="text-xl font-medium tracking-tight">Events</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Browse prediction-market events. Each event groups related markets.
					</p>
				</div>
				<Suspense fallback={<TagsScrollerFallback />}>
					<EventTagsScroller />
				</Suspense>
				<EventsStatusListing
					initialEvents={events.map(eventResponseToRow)}
					initialTab={tab}
					initialCursor={activeCursor ?? null}
					initialHasMore={hasMore}
					initialNextCursor={nextCursor}
					sortBy={sort_by}
					sortDirection={sort_dir}
					timeframe={timeframe}
				/>
			</div>
		</>
	);
}

function TagsScrollerFallback() {
	return (
		<div className="-mx-4 flex gap-2 overflow-hidden px-4 sm:-mx-6 sm:px-6">
			{Array.from({ length: 12 }).map((_, i) => (
				<Skeleton key={i} className="h-8 w-20 shrink-0 rounded-4xl" />
			))}
		</div>
	);
}

function EventsPageFallback() {
	return (
		<>
			<Skeleton className="h-5 w-32" />
			<div className="mt-6 space-y-4">
				<div>
					<Skeleton className="h-7 w-28" />
					<Skeleton className="mt-1 h-5 w-72" />
				</div>
				<TagsScrollerFallback />
				<DataTableSkeleton
					columns={EVENT_SKELETON_COLUMNS}
					rowCount={24}
					toolbarLeft={
						<div className="flex items-end gap-5">
							<Skeleton className="h-7 w-14" />
							<Skeleton className="h-7 w-20" />
						</div>
					}
				/>
			</div>
			<nav
				aria-hidden="true"
				className="mt-8 flex items-center justify-center gap-3"
			>
				<Skeleton className="h-10 w-28" />
				<Skeleton className="h-10 w-28" />
			</nav>
		</>
	);
}
