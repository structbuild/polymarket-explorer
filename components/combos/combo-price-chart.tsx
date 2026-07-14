import { ComboPriceChartClient } from "@/components/combos/combo-price-chart-client";
import { ChartCard } from "@/components/market/chart-card";
import { getComboCandlesticks } from "@/lib/struct/queries/combos";

type ComboPricePoint = { t: number; price: number };

export async function ComboPriceChart({ conditionId }: { conditionId: string }) {
	const candlesticks = await getComboCandlesticks(conditionId, "60");
	const bars = candlesticks?.combo ?? [];

	const data = bars.reduce<ComboPricePoint[]>((acc, bar) => {
		const price = bar.c ?? bar.m ?? null;
		if (price != null && Number.isFinite(price)) {
			acc.push({ t: bar.t, price });
		}
		return acc;
	}, []);

	if (data.length < 2) {
		return (
			<ChartCard title="Combo price">
				<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[320px]">
					No price history yet.
				</div>
			</ChartCard>
		);
	}

	return (
		<ChartCard title="Combo price">
			<ComboPriceChartClient data={data} />
		</ChartCard>
	);
}

export function ComboPriceChartFallback() {
	return (
		<ChartCard title="Combo price">
			<div className="h-[260px] animate-pulse rounded-md bg-muted/60 sm:h-[320px]" />
		</ChartCard>
	);
}
