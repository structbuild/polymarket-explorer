"use client";

import { useCallback, useTransition } from "react";
import { useQueryStates } from "nuqs";

import { EventStatusTabs } from "@/components/event/event-status-tabs";
import { SortableEventsTable } from "@/components/event/sortable-events-table";
import { PaginationNav } from "@/components/seo/pagination-nav";
import { eventSearchParamParsers } from "@/lib/event-search-params";
import {
	DEFAULT_EVENT_STATUS_TAB,
	defaultEventSortBy,
	defaultEventSortDirection,
	defaultEventTimeframe,
	type EventSortBy,
	type EventSortDirection,
	type EventStatusTab,
	type EventTimeframe,
} from "@/lib/event-search-params-shared";
import type { EventTableRow } from "@/lib/event-table-map";

function emptyMessage(tab: EventStatusTab) {
	return tab === "closed" ? "No closed events found." : "No open events found.";
}

function buildEventsBaseParams({
	sortBy,
	sortDirection,
	timeframe,
	tab,
}: {
	sortBy: EventSortBy;
	sortDirection: EventSortDirection;
	timeframe: EventTimeframe;
	tab: EventStatusTab;
}) {
	const baseParams: Record<string, string> = {};
	if (sortBy !== defaultEventSortBy) baseParams.sort_by = sortBy;
	if (sortDirection !== defaultEventSortDirection) baseParams.sort_dir = sortDirection;
	if (timeframe !== defaultEventTimeframe) baseParams.timeframe = timeframe;
	if (tab !== DEFAULT_EVENT_STATUS_TAB) baseParams.tab = tab;
	return baseParams;
}

export function EventsStatusListing({
	initialEvents,
	initialTab,
	initialCursor,
	initialHasMore,
	initialNextCursor,
	sortBy,
	sortDirection,
	timeframe,
}: {
	initialEvents: EventTableRow[];
	initialTab: EventStatusTab;
	initialCursor: string | null;
	initialHasMore: boolean;
	initialNextCursor: string | null;
	sortBy: EventSortBy;
	sortDirection: EventSortDirection;
	timeframe: EventTimeframe;
}) {
	const [isPending, startTransition] = useTransition();
	const [, setSearchParams] = useQueryStates(eventSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	});

	const handleTabChange = useCallback((nextTab: EventStatusTab) => {
		if (nextTab === initialTab) return;
		void setSearchParams({ tab: nextTab, cursor: "" });
	}, [initialTab, setSearchParams]);

	const toolbar = (
		<EventStatusTabs
			value={initialTab}
			onValueChange={handleTabChange}
			pending={isPending}
		/>
	);

	return (
		<>
			{initialEvents.length > 0 ? (
				<SortableEventsTable
					events={initialEvents}
					paginationMode="none"
					sortBy={sortBy}
					sortDirection={sortDirection}
					timeframe={timeframe}
					toolbarLeft={toolbar}
				/>
			) : (
				<>
					{toolbar}
					<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
						{emptyMessage(initialTab)}
					</p>
				</>
			)}
			<PaginationNav
				basePath="/events"
				baseParams={buildEventsBaseParams({
					sortBy,
					sortDirection,
					timeframe,
					tab: initialTab,
				})}
				cursor={initialCursor}
				nextCursor={initialNextCursor}
				hasMore={initialHasMore}
			/>
		</>
	);
}
