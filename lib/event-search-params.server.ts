import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";

import {
	DEFAULT_EVENT_STATUS_TAB,
	defaultEventSortBy,
	defaultEventSortDirection,
	defaultEventTimeframe,
	eventSortByValues,
	eventSortDirectionValues,
	eventStatusTabValues,
	eventTimeframeValues,
} from "./event-search-params-shared";

const eventSearchParamParsers = {
	sort_by: parseAsStringLiteral(eventSortByValues).withDefault(defaultEventSortBy),
	sort_dir: parseAsStringLiteral(eventSortDirectionValues).withDefault(defaultEventSortDirection),
	timeframe: parseAsStringLiteral(eventTimeframeValues).withDefault(defaultEventTimeframe),
	tab: parseAsStringLiteral(eventStatusTabValues).withDefault(DEFAULT_EVENT_STATUS_TAB),
	cursor: parseAsString.withDefault(""),
};

export const loadEventSearchParams = createLoader(eventSearchParamParsers);
