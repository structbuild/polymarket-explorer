import { connection } from "next/server";

import {
	BestTradesListClient,
	type BestTradesTimeframe,
} from "@/components/home/best-trades-list-client";
import { getTopTradesMarkets } from "@/lib/struct/queries";

const ROW_COUNT = 12;
const DEFAULT_TIMEFRAME: BestTradesTimeframe = "1d";

export async function BestTradesList() {
	await connection();

	const { data: rows } = await getTopTradesMarkets({
		timeframe: DEFAULT_TIMEFRAME,
		limit: ROW_COUNT,
	});

	return (
		<BestTradesListClient
			initialTrades={rows}
			initialTimeframe={DEFAULT_TIMEFRAME}
			limit={ROW_COUNT}
		/>
	);
}

export function BestTradesListFallback() {
	return (
		<div className="overflow-hidden rounded-lg bg-card sm:col-span-2 sm:row-start-2">
			<div className="space-y-2 p-4">
				{Array.from({ length: ROW_COUNT }, (_, i) => (
					<div key={i} className="flex items-center gap-3">
						<div className="size-7 shrink-0 animate-pulse rounded-sm bg-muted" />
						<div className="h-4 w-24 animate-pulse rounded bg-muted" />
						<div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
						<div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		</div>
	);
}
