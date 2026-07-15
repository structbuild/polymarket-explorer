import { ComboPriceChartClient, type ComboLegSeries } from "@/components/combos/combo-price-chart-client";
import { ComboResolutionToggle } from "@/components/combos/combo-resolution-toggle";
import { DEFAULT_COMBO_RESOLUTION, type ComboResolution } from "@/components/combos/combo-resolution";
import { ChartCard } from "@/components/market/chart-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { NormalizedComboLeg } from "@/lib/combo";
import { getComboCandlesticks } from "@/lib/struct/queries/combos";
import { truncateMarketTitle } from "@/lib/utils";

type ComboPricePoint = { t: number; price: number };

const MAX_LEG_OVERLAYS = 6;

function toPoints(bars: ReadonlyArray<{ t: number; c?: number | null; m?: number | null }>): ComboPricePoint[] {
	return bars.reduce<ComboPricePoint[]>((acc, bar) => {
		const price = bar.c ?? bar.m ?? null;
		if (price != null && Number.isFinite(price)) {
			acc.push({ t: bar.t, price });
		}
		return acc;
	}, []);
}

export async function ComboPriceChart({
	conditionId,
	resolution = DEFAULT_COMBO_RESOLUTION,
	comboLegs = [],
}: {
	conditionId: string;
	resolution?: ComboResolution;
	comboLegs?: NormalizedComboLeg[];
}) {
	const candlesticks = await getComboCandlesticks(conditionId, resolution);
	const data = toPoints(candlesticks?.combo ?? []);

	const legMetaByPositionId = new Map(
		comboLegs.filter((leg) => leg.positionId).map((leg) => [leg.positionId, leg]),
	);

	const legs: ComboLegSeries[] = (candlesticks?.legs ?? [])
		.slice(0, MAX_LEG_OVERLAYS)
		.map((leg, index) => {
			const meta = leg.position_id ? legMetaByPositionId.get(leg.position_id) : undefined;
			const question = meta?.question || meta?.title || null;
			return {
				key: `leg${index}`,
				label: question ? truncateMarketTitle(question) : `Leg ${index + 1}`,
				outcome: meta?.outcome ?? null,
				points: toPoints(leg.candles ?? []),
			};
		})
		.filter((leg) => leg.points.length >= 2);

	const action = <ComboResolutionToggle resolution={resolution} />;

	if (data.length < 2) {
		return (
			<ChartCard title="Combo price" action={action}>
				<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[320px]">
					No price history yet.
				</div>
			</ChartCard>
		);
	}

	return (
		<ChartCard title="Combo price" action={action}>
			<ComboPriceChartClient data={data} legs={legs} />
		</ChartCard>
	);
}

export function ComboPriceChartFallback() {
	return (
		<ChartCard title="Combo price" action={<Skeleton className="h-7 w-28" />}>
			<div className="h-[260px] min-h-[260px] animate-pulse rounded-md bg-muted/60 sm:h-[320px]" />
		</ChartCard>
	);
}
