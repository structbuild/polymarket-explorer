import { ChartCard } from "@/components/market/chart-card";
import { MarketVolumeChartClient } from "@/components/market/market-volume-chart-client";
import { getMarketChart, getPositionVolumeChart } from "@/lib/struct/market-queries";

export async function MarketVolumeChart({ conditionId }: { conditionId: string }) {
	const outcomes = await getMarketChart(conditionId);

	if (!outcomes?.length) {
		return null;
	}

	const volumeOutcomes = (
		await Promise.all(
			outcomes.map(async (o) => {
				try {
					const points = await getPositionVolumeChart(o.position_id);
					const data = (points ?? [])
						.filter((p) => (p.bv ?? 0) + (p.sv ?? 0) > 0)
						.map((p) => ({ t: p.t, buy: p.bv ?? 0, sell: p.sv ?? 0 }));
					return { name: o.name, outcomeIndex: o.outcome_index, data };
				} catch {
					return null;
				}
			}),
		)
	).filter((o): o is NonNullable<typeof o> => o !== null && o.data.length > 0);

	if (volumeOutcomes.length === 0) {
		return null;
	}

	return (
		<ChartCard title="Volume">
			<MarketVolumeChartClient outcomes={volumeOutcomes} />
		</ChartCard>
	);
}

export function MarketVolumeChartFallback() {
	return (
		<ChartCard title="Volume">
			<div className="h-[220px] animate-pulse rounded-md bg-muted/60" />
		</ChartCard>
	);
}
