import { ChartCard } from "@/components/market/chart-card";
import { MarketHoldersHistoryClient } from "@/components/market/market-holders-history-client";
import { getMarketHoldersHistory } from "@/lib/struct/market-queries";

export async function MarketHoldersHistory({ conditionId }: { conditionId: string }) {
	const candles = await getMarketHoldersHistory(conditionId);
	const data = (candles ?? [])
		.filter((c): c is { t: number; h: number } => Number.isFinite(c.t) && Number.isFinite(c.h))
		.sort((a, b) => a.t - b.t);

	if (data.length === 0) {
		return (
			<ChartCard>
				<p className="py-8 text-center text-sm text-muted-foreground">No holder history yet</p>
			</ChartCard>
		);
	}

	return (
		<ChartCard>
			<MarketHoldersHistoryClient data={data} />
		</ChartCard>
	);
}

export function MarketHoldersHistoryFallback() {
	return (
		<ChartCard>
			<div className="h-[260px] w-full animate-pulse rounded bg-muted/60 sm:h-[320px]" />
		</ChartCard>
	);
}
