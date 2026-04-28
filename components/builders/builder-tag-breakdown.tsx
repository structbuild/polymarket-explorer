"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import type { BuilderTagRow } from "@structbuild/sdk";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { formatCapitalizeWords, formatNumber, slugify } from "@/lib/format";

type TagDatum = {
	tag: string;
	label: string;
	slug: string;
	volumeUsd: number;
	sharePct: number;
};

const CHART_CONFIG = {
	volumeUsd: { label: "Volume", color: "var(--primary)" },
} satisfies ChartConfig;

const ROW_HEIGHT_PX = 32;
const CHART_PADDING_PX = 24;
const MAX_CHART_HEIGHT_PX = 320;
const MIN_BAR_PX_FOR_LABELS = 80;

function n(v: unknown, fallback = 0): number {
	if (typeof v === "number") return v;
	if (typeof v === "string") {
		const parsed = Number(v);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
}

type BarLabelProps = Record<string, unknown>;

function TagNameBarLabel(props: BarLabelProps) {
	const x = n(props.x);
	const y = n(props.y);
	const width = n(props.width);
	const height = n(props.height);
	const value = props.value;
	if (!width || width < MIN_BAR_PX_FOR_LABELS) return null;
	return (
		<text
			x={x + 8}
			y={y + height / 2}
			fill="white"
			fontSize={12}
			dominantBaseline="middle"
		>
			{value != null ? String(value) : ""}
		</text>
	);
}

type BuilderTagBreakdownProps = {
	rows: BuilderTagRow[];
};

export function BuilderTagBreakdown({ rows }: BuilderTagBreakdownProps) {
	const router = useRouter();

	const data = useMemo<TagDatum[]>(() => {
		const total = rows.reduce((sum, row) => sum + (row.volume_usd ?? 0), 0);
		return rows.map((row) => ({
			tag: row.tag,
			label: formatCapitalizeWords(row.tag),
			slug: slugify(row.tag),
			volumeUsd: row.volume_usd,
			sharePct: total > 0 ? (row.volume_usd / total) * 100 : 0,
		}));
	}, [rows]);

	if (rows.length === 0) {
		return (
			<Card variant="analytics" className="h-full">
				<CardContent className="text-sm text-muted-foreground">
					No tag activity in this window.
				</CardContent>
			</Card>
		);
	}

	const chartHeight = Math.min(
		data.length * ROW_HEIGHT_PX + CHART_PADDING_PX,
		MAX_CHART_HEIGHT_PX
	);

	return (
		<Card variant="analytics" className="h-full">
			<CardContent className="space-y-4">
				<div className="flex items-center gap-1.5">
					<h3 className="text-sm font-medium text-muted-foreground">Tag breakdown</h3>
					<InfoTooltip content="Where this builder's volume goes by category." />
				</div>

				<ChartContainer
					config={CHART_CONFIG}
					className="aspect-auto w-full"
					style={{ height: chartHeight }}
				>
					<BarChart
						accessibilityLayer
						data={data}
						layout="vertical"
						margin={{ right: 56 }}
					>
						<CartesianGrid horizontal={false} />
						<YAxis
							dataKey="label"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							hide
						/>
						<XAxis dataKey="volumeUsd" type="number" hide />
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									indicator="line"
									formatter={(_value, _name, item) => {
										const payload = item?.payload as TagDatum | undefined;
										if (!payload) return null;
										return (
											<span className="flex w-full items-center justify-between gap-4">
												<span className="text-muted-foreground">{payload.label}</span>
												<span className="font-mono font-medium tabular-nums">
													{formatNumber(payload.volumeUsd, { compact: true, currency: true })}
													<span className="ml-2 text-muted-foreground">
														{formatNumber(payload.sharePct, { decimals: 1, percent: true })}
													</span>
												</span>
											</span>
										);
									}}
								/>
							}
						/>
						<Bar
							dataKey="volumeUsd"
							fill="var(--color-volumeUsd)"
							radius={4}
							onClick={(payload) => {
								const datum = payload as unknown as TagDatum;
								if (datum?.slug) {
									router.push(`/tags/${datum.slug}` as Route);
								}
							}}
							style={{ cursor: "pointer" }}
						>
							<LabelList
								dataKey="label"
								position="insideLeft"
								offset={8}
								content={(props: unknown) => (
									<TagNameBarLabel {...(props as BarLabelProps)} />
								)}
							/>
							<LabelList
								dataKey="volumeUsd"
								position="right"
								offset={8}
								className="fill-foreground tabular-nums"
								fontSize={12}
								formatter={(value) =>
									formatNumber(Number(value), { compact: true, currency: true })
								}
							/>
						</Bar>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
