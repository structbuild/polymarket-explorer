"use client";

import { useCallback, useTransition } from "react";
import { useQueryStates } from "nuqs";

import type {
	EventSortBy,
	EventSortDirection,
	EventTimeframe,
} from "@/lib/event-search-params-shared";
import { eventSearchParamParsers } from "@/lib/event-search-params";
import type { EventTableRow } from "@/lib/event-table-map";

import { EventsTable } from "./events-table";

type SortableEventsTableProps = {
	events: EventTableRow[];
	sortBy: EventSortBy;
	sortDirection: EventSortDirection;
	timeframe: EventTimeframe;
	storageKey?: string;
	toolbarLeft?: React.ReactNode;
	paginationMode?: "client" | "none";
};

export function SortableEventsTable({
	events,
	sortBy,
	sortDirection,
	timeframe,
	...rest
}: SortableEventsTableProps) {
	const [, startTransition] = useTransition();
	const [, setSearchParams] = useQueryStates(eventSearchParamParsers, {
		history: "push",
		scroll: false,
		shallow: false,
		startTransition,
	});

	const handleSortChange = useCallback(
		(nextSortBy: EventSortBy) => {
			const nextDir: EventSortDirection =
				nextSortBy === sortBy && sortDirection === "desc" ? "asc" : "desc";
			void setSearchParams({ sort_by: nextSortBy, sort_dir: nextDir, cursor: "" });
		},
		[setSearchParams, sortBy, sortDirection],
	);

	const handleTimeframeChange = useCallback(
		(nextTimeframe: EventTimeframe) => {
			void setSearchParams({ timeframe: nextTimeframe, cursor: "" });
		},
		[setSearchParams],
	);

	return (
		<EventsTable
			{...rest}
			events={events}
			sortingMode="server"
			sortBy={sortBy}
			sortDirection={sortDirection}
			onSortChange={handleSortChange}
			timeframe={timeframe}
			onTimeframeChange={handleTimeframeChange}
		/>
	);
}
