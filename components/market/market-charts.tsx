import { ChartCard } from "@/components/market/chart-card";
import { MarketChartsClient } from "@/components/market/market-charts-client";
import { getMarketChart, getPositionVolumeChart } from "@/lib/struct/market-queries";

export async function MarketCharts({ conditionId }: { conditionId: string }) {
	const outcomes = await getMarketChart(conditionId);

	const hasPrice = !!outcomes?.length && outcomes.some((o) => o.data.length > 1);

	const volumeOutcomes = outcomes?.length
		? (
					await Promise.all(
						outcomes.map(async (o) => {
							try {
								const points = await getPositionVolumeChart(o.position_id);
								const data = (points ?? [])
									.filter((p) => (p.bv ?? 0) + (p.sv ?? 0) > 0)
									.map((p) => ({ t: p.t, buy: p.bv ?? 0, sell: p.sv ?? 0 }));
								return {
									name: o.name,
									outcomeIndex: o.outcome_index,
									data,
								};
							} catch {
								return null;
							}
						}),
					)
				).filter((o): o is NonNullable<typeof o> => o !== null && o.data.length > 0)
			: [];

	const hasVolume = volumeOutcomes.length > 0;

	if (!hasPrice && !hasVolume) {
		return null;
	}

	return (
		<MarketChartsClient
			outcomes={hasPrice ? outcomes! : null}
			volume={hasVolume ? volumeOutcomes : null}
		/>
	);
}

export function MarketChartsFallback() {
	return (
		<ChartCard title="Activity">
			<div className="h-[260px] animate-pulse rounded-md bg-muted/60 sm:h-[320px]" />
		</ChartCard>
	);
}
