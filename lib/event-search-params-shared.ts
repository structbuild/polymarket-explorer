import { METRICS_TIMEFRAMES, type MetricsTimeframeChoice } from "./timeframes";

export const eventSortByValues = [
	"volume",
	"txns",
	"unique_traders",
	"end_date",
	"start_date",
	"creation_date",
] as const;

export type EventSortBy = (typeof eventSortByValues)[number];

export const eventSortDirectionValues = ["asc", "desc"] as const;
export type EventSortDirection = (typeof eventSortDirectionValues)[number];

export const eventTimeframeValues = METRICS_TIMEFRAMES;
export type EventTimeframe = MetricsTimeframeChoice;

export const eventStatusTabValues = ["open", "closed"] as const;
export type EventStatusTab = (typeof eventStatusTabValues)[number];
export const DEFAULT_EVENT_STATUS_TAB: EventStatusTab = "open";

export function parseEventStatusTab(value: string | string[] | undefined): EventStatusTab {
	const raw = Array.isArray(value) ? value[0] : value;
	return eventStatusTabValues.includes(raw as EventStatusTab)
		? (raw as EventStatusTab)
		: DEFAULT_EVENT_STATUS_TAB;
}

export const defaultEventSortBy: EventSortBy = "volume";
export const defaultEventSortDirection: EventSortDirection = "desc";
export const defaultEventTimeframe: EventTimeframe = "24h";
