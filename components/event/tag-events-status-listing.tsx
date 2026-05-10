"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { getTagEventsStatusPageAction } from "@/app/actions";
import { EventStatusTabs } from "@/components/event/event-status-tabs";
import { EventsTable } from "@/components/event/events-table";
import { PaginationNav } from "@/components/seo/pagination-nav";
import {
	DEFAULT_EVENT_STATUS_TAB,
	type EventStatusTab,
} from "@/lib/event-search-params-shared";
import type { EventTableRow } from "@/lib/event-table-map";

type TagEventsState = {
	events: EventTableRow[];
	tab: EventStatusTab;
	hasMore: boolean;
	nextCursor: string | null;
	cursor: string | null;
};

function buildStatusHref(tab: EventStatusTab) {
	const params = new URLSearchParams(window.location.search);

	if (tab === DEFAULT_EVENT_STATUS_TAB) {
		params.delete("tab");
	} else {
		params.set("tab", tab);
	}

	params.delete("cursor");
	params.delete("page");

	const search = params.toString();
	return `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
}

function replaceStatusUrl(tab: EventStatusTab) {
	window.history.replaceState(window.history.state, "", buildStatusHref(tab));
}

function emptyMessage(tab: EventStatusTab) {
	return tab === "closed"
		? "No closed events found for this tag."
		: "No open events found for this tag.";
}

export function TagEventsStatusListing({
	basePath,
	baseParams,
	tagSlug,
	initialEvents,
	initialTab,
	initialCursor,
	initialHasMore,
	initialNextCursor,
}: {
	basePath: string;
	baseParams: Record<string, string>;
	tagSlug: string;
	initialEvents: EventTableRow[];
	initialTab: EventStatusTab;
	initialCursor: string | null;
	initialHasMore: boolean;
	initialNextCursor: string | null;
}) {
	const [isPending, startTransition] = useTransition();
	const [state, setState] = useState<TagEventsState>(() => ({
		events: initialEvents,
		tab: initialTab,
		hasMore: initialHasMore,
		nextCursor: initialNextCursor,
		cursor: initialCursor,
	}));

	const lastSyncedProps = useRef({
		events: initialEvents,
		tab: initialTab,
		hasMore: initialHasMore,
		nextCursor: initialNextCursor,
		cursor: initialCursor,
	});
	const latestRequestId = useRef(0);

	useEffect(() => {
		const prev = lastSyncedProps.current;
		if (
			prev.events === initialEvents &&
			prev.tab === initialTab &&
			prev.hasMore === initialHasMore &&
			prev.nextCursor === initialNextCursor &&
			prev.cursor === initialCursor
		) {
			return;
		}
		lastSyncedProps.current = {
			events: initialEvents,
			tab: initialTab,
			hasMore: initialHasMore,
			nextCursor: initialNextCursor,
			cursor: initialCursor,
		};
		setState({
			events: initialEvents,
			tab: initialTab,
			hasMore: initialHasMore,
			nextCursor: initialNextCursor,
			cursor: initialCursor,
		});
	}, [initialEvents, initialTab, initialHasMore, initialNextCursor, initialCursor]);

	const handleTabChange = useCallback(
		(nextTab: EventStatusTab) => {
			if (nextTab === state.tab) return;

			const previousTab = state.tab;
			const requestId = ++latestRequestId.current;
			replaceStatusUrl(nextTab);
			startTransition(async () => {
				try {
					const result = await getTagEventsStatusPageAction({
						tagSlug,
						tab: nextTab,
					});
					if (requestId !== latestRequestId.current) return;

					setState({
						events: result.events,
						tab: result.tab,
						hasMore: result.hasMore,
						nextCursor: result.nextCursor,
						cursor: null,
					});
				} catch (error) {
					if (requestId !== latestRequestId.current) return;
					console.error("Failed to load tag events for tab", nextTab, error);
					replaceStatusUrl(previousTab);
				}
			});
		},
		[state.tab, tagSlug],
	);

	const toolbar = (
		<EventStatusTabs
			value={state.tab}
			onValueChange={handleTabChange}
			pending={isPending}
		/>
	);

	const paginationBaseParams = {
		...baseParams,
		...(state.tab !== DEFAULT_EVENT_STATUS_TAB ? { tab: state.tab } : {}),
	};

	return (
		<>
			{state.events.length > 0 ? (
				<EventsTable
					events={state.events}
					sortingMode="client"
					paginationMode="none"
					toolbarLeft={toolbar}
				/>
			) : (
				<>
					{toolbar}
					<p className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
						{emptyMessage(state.tab)}
					</p>
				</>
			)}
			<PaginationNav
				basePath={basePath}
				baseParams={paginationBaseParams}
				cursor={state.cursor}
				nextCursor={state.nextCursor}
				hasMore={state.hasMore}
			/>
		</>
	);
}
