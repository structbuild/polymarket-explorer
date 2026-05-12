import type { Event, EventMarket, EventMarketChartOutcome } from "@structbuild/sdk";

import { ChartCard } from "@/components/market/chart-card";
import { EventOverviewChartClient } from "@/components/event/event-overview-chart-client";
import { getEventChart, type EventChartResolution } from "@/lib/struct/queries/events";

const MAX_SERIES = 4;
const ACTIVE_STATUSES = new Set(["open", "active"]);

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

const RESOLUTION_LADDER: { maxAgeSeconds: number; resolution: EventChartResolution }[] = [
	{ maxAgeSeconds: 1 * HOUR, resolution: "1H" },
	{ maxAgeSeconds: 6 * HOUR, resolution: "6H" },
	{ maxAgeSeconds: 1 * DAY, resolution: "1D" },
	{ maxAgeSeconds: 7 * DAY, resolution: "1W" },
	{ maxAgeSeconds: 30 * DAY, resolution: "1M" },
];

function isActive(market: EventMarket) {
	return ACTIVE_STATUSES.has((market.status ?? "").toLowerCase());
}

function leadingProbability(market: EventMarket): number {
	return market.outcomes?.[0]?.price ?? 0;
}

function pickTopMarkets(markets: EventMarket[]): {
	picked: EventMarket[];
	fromActive: boolean;
} {
	const withCondition = markets.filter((m) => m.condition_id);
	const active = withCondition.filter(isActive);

	if (active.length > 0) {
		const picked = [...active]
			.sort((a, b) => leadingProbability(b) - leadingProbability(a))
			.slice(0, MAX_SERIES);
		return { picked, fromActive: true };
	}

	const picked = [...withCondition]
		.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
		.slice(0, MAX_SERIES);
	return { picked, fromActive: false };
}

function pickResolution(event: Event, nowSeconds: number = Math.floor(Date.now() / 1000)): EventChartResolution {
	const start = event.start_time ?? event.created_time ?? null;
	if (start == null) return "ALL";

	const upperBound = event.end_time != null && event.end_time > 0 && event.end_time < nowSeconds
		? event.end_time
		: nowSeconds;

	const ageSeconds = Math.max(0, upperBound - start);
	for (const step of RESOLUTION_LADDER) {
		if (ageSeconds <= step.maxAgeSeconds) return step.resolution;
	}
	return "ALL";
}

function hasUsableSeries(outcomes: EventMarketChartOutcome[] | null): outcomes is EventMarketChartOutcome[] {
	return !!outcomes && outcomes.some((o) => (o.data?.length ?? 0) > 0);
}

export async function EventOverviewChart({
	event,
}: {
	event: Event;
}) {
	const eventSlug = event.event_slug;
	if (!eventSlug) return null;

	const markets = event.markets ?? [];
	const { picked, fromActive } = pickTopMarkets(markets);
	const resolution = pickResolution(event);

	let outcomes: EventMarketChartOutcome[] | null = null;
	let usedConditionFilter = false;

	if (picked.length > 0) {
		const conditionIds = picked.map((m) => m.condition_id);
		outcomes = await getEventChart(eventSlug, resolution, { conditionIds });
		usedConditionFilter = hasUsableSeries(outcomes);
	}

	if (!usedConditionFilter) {
		outcomes = await getEventChart(eventSlug, resolution);
	}

	const tooltip = usedConditionFilter
		? fromActive
			? `Top ${picked.length} active markets by current probability · ${resolution} window.`
			: `Top ${picked.length} markets by lifetime volume · ${resolution} window.`
		: `Top markets by YES probability · ${resolution} window.`;

	if (!hasUsableSeries(outcomes)) {
		return (
			<ChartCard title="Probability history" tooltip={tooltip}>
				<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[320px]">
					No probability data available yet.
				</div>
			</ChartCard>
		);
	}

	return (
		<ChartCard title="Probability history" tooltip={tooltip}>
			<EventOverviewChartClient outcomes={outcomes} />
		</ChartCard>
	);
}

export function EventOverviewChartFallback() {
	return (
		<ChartCard title="Probability history">
			<div className="h-[260px] animate-pulse rounded-md bg-muted/60" />
		</ChartCard>
	);
}
