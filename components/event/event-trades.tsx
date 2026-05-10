import type { EventMarket } from "@structbuild/sdk";

import { EventTradesTable } from "@/components/event/event-trades-table";
import { defaultEventTradesLimit, getEventTrades } from "@/lib/struct/queries/market-trades";

const MAX_MARKETS = 10;

export async function EventTrades({ markets }: { markets: EventMarket[] }) {
	const conditionIds = [...markets]
		.sort((a, b) => (b.volume_24hr ?? b.volume ?? 0) - (a.volume_24hr ?? a.volume ?? 0))
		.slice(0, MAX_MARKETS)
		.map((m) => m.condition_id)
		.filter((id): id is string => Boolean(id));

	if (conditionIds.length === 0) {
		return null;
	}

	const trades = await getEventTrades(conditionIds, defaultEventTradesLimit);

	return <EventTradesTable trades={trades} />;
}

export function EventTradesFallback() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-medium tracking-tight">Recent trades</h2>
			</div>
			<div className="overflow-hidden rounded-lg border bg-card">
				<div className="space-y-2 p-4">
					{Array.from({ length: 8 }, (_, i) => (
						<div key={i} className="h-12 animate-pulse rounded bg-muted/60" />
					))}
				</div>
			</div>
		</div>
	);
}
