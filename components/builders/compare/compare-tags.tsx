"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { formatCapitalizeWords, formatNumber } from "@/lib/format";
import { useVolumeMode } from "@/lib/hooks/use-volume-mode";
import type { CompareBuilder } from "@/lib/struct/builder-compare";

const MAX_TAGS = 8;
const ROW_HEIGHT_PX = 22;
const ROW_GAP_PX = 18;
const MAX_CHART_HEIGHT_PX = 520;

type CompareTagsProps = {
	builders: CompareBuilder[];
};

export function CompareTags({ builders }: CompareTagsProps) {
	const { mode } = useVolumeMode();

	const { data, config } = useMemo(() => {
		const useUsd = mode === "usd";
		const tagScores = new Map<string, number>();
		const tagRows = new Map<string, Record<string, number>>();

		for (const builder of builders) {
			const total = useUsd
				? builder.row.volume_usd ?? 0
				: builder.row.shares_volume ?? 0;
			for (const tag of builder.tags) {
				const value = useUsd ? tag.volume_usd ?? 0 : tag.shares_volume ?? 0;
				const sharePct = total > 0 ? (value / total) * 100 : 0;
				if (!tagRows.has(tag.tag)) tagRows.set(tag.tag, {});
				tagRows.get(tag.tag)![builder.seriesKey] = sharePct;
				tagScores.set(tag.tag, (tagScores.get(tag.tag) ?? 0) + sharePct);
			}
		}

		const topTags = [...tagScores.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, MAX_TAGS)
			.map(([tag]) => tag);

		const data = topTags.map((tag) => {
			const row: Record<string, number | string> = {
				tag,
				label: formatCapitalizeWords(tag),
			};
			const shares = tagRows.get(tag) ?? {};
			for (const builder of builders) {
				row[builder.seriesKey] = shares[builder.seriesKey] ?? 0;
			}
			return row;
		});

		const config: ChartConfig = {};
		for (const builder of builders) {
			config[builder.seriesKey] = { label: builder.displayName, color: builder.color };
		}

		return { data, config };
	}, [builders, mode]);

	if (data.length === 0) {
		return (
			<Card variant="analytics">
				<CardContent className="text-sm text-muted-foreground">
					No tag activity in this window.
				</CardContent>
			</Card>
		);
	}

	const chartHeight = Math.min(
		data.length * (builders.length * ROW_HEIGHT_PX + ROW_GAP_PX) + 24,
		MAX_CHART_HEIGHT_PX,
	);

	return (
		<Card variant="analytics">
			<CardContent className="space-y-4">
				<div className="flex items-center gap-1.5">
					<h3 className="text-sm font-medium text-muted-foreground">Tag focus</h3>
					<InfoTooltip content="Share of each builder's own volume that goes to a category. Top categories across the compared builders." />
				</div>
				<ChartContainer
					config={config}
					className="aspect-auto w-full"
					style={{ height: chartHeight }}
				>
					<BarChart
						accessibilityLayer
						data={data}
						layout="vertical"
						margin={{ left: 4, right: 16 }}
						barCategoryGap="20%"
					>
						<CartesianGrid horizontal={false} />
						<YAxis
							dataKey="label"
							type="category"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							width={96}
							tick={{ fontSize: 12 }}
						/>
						<XAxis
							type="number"
							tickLine={false}
							axisLine={false}
							tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
							tick={{ fontSize: 11 }}
						/>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									indicator="dot"
									formatter={(value, name) => (
										<span className="flex w-full items-center justify-between gap-4">
											<span className="text-muted-foreground">
												{config[name as string]?.label ?? name}
											</span>
											<span className="font-mono font-medium tabular-nums">
												{formatNumber(Number(value), { decimals: 1, percent: true })}
											</span>
										</span>
									)}
								/>
							}
						/>
						{builders.map((builder) => (
							<Bar
								key={builder.seriesKey}
								dataKey={builder.seriesKey}
								fill={`var(--color-${builder.seriesKey})`}
								radius={3}
							/>
						))}
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
