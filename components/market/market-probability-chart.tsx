import { ChartCard } from "@/components/market/chart-card";
import { MarketProbabilityChartClient } from "@/components/market/market-probability-chart-client";
import { getMarketChart } from "@/lib/struct/market-queries";

export async function MarketProbabilityChart({ conditionId }: { conditionId: string }) {
	const outcomes = await getMarketChart(conditionId);

	if (!outcomes?.length || !outcomes.some((o) => o.data.length > 1)) {
		return null;
	}

	return (
		<ChartCard title="Probability history">
			<MarketProbabilityChartClient outcomes={outcomes} />
		</ChartCard>
	);
}

export function MarketProbabilityChartFallback() {
	return (
		<ChartCard title="Probability history">
			<div className="h-[260px] animate-pulse rounded-md bg-muted/60" />
		</ChartCard>
	);
}
