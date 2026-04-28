"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import type { BuilderSortBy, BuilderTimeframe, GlobalBuilderTagRow } from "@structbuild/sdk";

import { getBuilderGlobalTagsAction } from "@/app/actions";
import { AnalyticsUrlToggle } from "@/components/analytics/url-toggle";
import { Card, CardContent } from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCapitalizeWords, formatNumber, slugify } from "@/lib/format";
import { getBuilderSortOptionsForTimeframe } from "@/lib/struct/builder-shared";

type TagMetric =
	| "volumeUsd"
	| "builderFeesUsd"
	| "uniqueTraders"
	| "txnCount"
	| "feesUsd"
	| "newUsers"
	| "avgRevenuePerUserUsd"
	| "avgVolumePerUserUsd";

type TagDatum = {
	tag: string;
	label: string;
	slug: string;
	volumeUsd: number;
	builderFeesUsd: number;
	feesUsd: number;
	uniqueTraders: number;
	txnCount: number;
	newUsers: number;
	avgRevenuePerUserUsd: number;
	avgVolumePerUserUsd: number;
	distinctBuilders: number;
	sharePct: number;
};

const TAG_SORT_OPTIONS = [
	"volume",
	"builder_fees",
	"traders",
	"txns",
	"fees",
	"new_users",
	"avg_rev_per_user",
	"avg_vol_per_user",
] as const satisfies readonly BuilderSortBy[];

type TagSortOption = (typeof TAG_SORT_OPTIONS)[number];

const SORT_LABELS: Record<TagSortOption, string> = {
	volume: "Volume",
	builder_fees: "Builder fees",
	traders: "Traders",
	txns: "Trades",
	fees: "Fees",
	new_users: "New users",
	avg_rev_per_user: "ARPU",
	avg_vol_per_user: "AVPU",
};

const SORT_TO_METRIC: Record<TagSortOption, TagMetric> = {
	volume: "volumeUsd",
	builder_fees: "builderFeesUsd",
	traders: "uniqueTraders",
	txns: "txnCount",
	fees: "feesUsd",
	new_users: "newUsers",
	avg_rev_per_user: "avgRevenuePerUserUsd",
	avg_vol_per_user: "avgVolumePerUserUsd",
};

const SORT_DESCRIPTIONS: Record<TagSortOption, string> = {
	volume: "Rank tags by builder-routed volume.",
	builder_fees: "Rank tags by builder fee revenue.",
	traders: "Rank tags by unique traders.",
	txns: "Rank tags by trade count.",
	fees: "Rank tags by total fees.",
	new_users: "Rank tags by first-time builder-attributed traders.",
	avg_rev_per_user: "Rank tags by builder fees per unique trader.",
	avg_vol_per_user: "Rank tags by volume per unique trader.",
};

const CURRENCY_METRICS = new Set<TagMetric>([
	"volumeUsd",
	"builderFeesUsd",
	"feesUsd",
	"avgRevenuePerUserUsd",
	"avgVolumePerUserUsd",
]);

const CHART_CONFIG = {
	volumeUsd: { label: "Volume", color: "var(--chart-1)" },
	builderFeesUsd: { label: "Builder fees", color: "var(--chart-1)" },
	uniqueTraders: { label: "Traders", color: "var(--chart-1)" },
	txnCount: { label: "Trades", color: "var(--chart-1)" },
	feesUsd: { label: "Fees", color: "var(--chart-1)" },
	newUsers: { label: "New users", color: "var(--chart-1)" },
	avgRevenuePerUserUsd: { label: "ARPU", color: "var(--chart-1)" },
	avgVolumePerUserUsd: { label: "AVPU", color: "var(--chart-1)" },
} satisfies ChartConfig;

const ROW_HEIGHT_PX = 32;
const CHART_PADDING_PX = 24;
const MAX_CHART_HEIGHT_PX = 380;

type BuildersGlobalTagsProps = {
	rows: GlobalBuilderTagRow[];
	sort: BuilderSortBy;
	timeframe: BuilderTimeframe;
};

function parseTagSort(sort: BuilderSortBy): TagSortOption {
	return TAG_SORT_OPTIONS.includes(sort as TagSortOption)
		? (sort as TagSortOption)
		: "volume";
}

export function BuildersGlobalTags({ rows, sort, timeframe }: BuildersGlobalTagsProps) {
	const [isPending, startTransition] = useTransition();
	const [tagState, setTagState] = useState(() => ({
		sourceRows: rows,
		sourceSort: sort,
		sourceTimeframe: timeframe,
		rows,
		sort,
	}));
	const hasLocalTags =
		tagState.sourceRows === rows &&
		tagState.sourceSort === sort &&
		tagState.sourceTimeframe === timeframe;
	const currentRows = hasLocalTags ? tagState.rows : rows;
	const currentSort = hasLocalTags ? tagState.sort : sort;
	const activeSort = parseTagSort(currentSort);
	const metric = SORT_TO_METRIC[activeSort];
	const sortOptions = useMemo(
		() =>
			TAG_SORT_OPTIONS.filter((option) =>
				getBuilderSortOptionsForTimeframe(timeframe).includes(option),
			),
		[timeframe],
	);
	const data = useMemo<TagDatum[]>(() => {
		const total = currentRows.reduce((sum, row) => sum + (row.volume_usd ?? 0), 0);
		return currentRows.map((row) => ({
			tag: row.tag,
			label: formatCapitalizeWords(row.tag),
			slug: slugify(row.tag),
			volumeUsd: row.volume_usd ?? 0,
			builderFeesUsd: row.builder_fees ?? 0,
			feesUsd: row.fees_usd ?? 0,
			uniqueTraders: row.unique_traders ?? 0,
			txnCount: row.txn_count ?? 0,
			newUsers: row.new_users ?? 0,
			avgRevenuePerUserUsd: row.avg_rev_per_user ?? 0,
			avgVolumePerUserUsd: row.avg_vol_per_user ?? 0,
			distinctBuilders: row.distinct_builders ?? 0,
			sharePct: total > 0 ? ((row.volume_usd ?? 0) / total) * 100 : 0,
		}));
	}, [currentRows]);

	if (currentRows.length === 0) {
		return (
			<Card variant="analytics">
				<CardContent className="text-sm text-muted-foreground">
					No tag activity in this window.
				</CardContent>
			</Card>
		);
	}

	const chartHeight = Math.min(
		data.length * ROW_HEIGHT_PX + CHART_PADDING_PX,
		MAX_CHART_HEIGHT_PX,
	);
	const isCurrencyMetric = CURRENCY_METRICS.has(metric);

	return (
		<section className="space-y-3">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-1.5">
						<h2 className="text-base font-medium text-foreground/90">
							Builder activity by tag
						</h2>
						<InfoTooltip content="Tags with builder-routed activity, aggregated across all builder codes in the selected window." />
					</div>
					<p className="text-sm text-muted-foreground">
						Categories where builders are routing volume, ranked by the selected metric.
					</p>
				</div>
				<AnalyticsUrlToggle
					paramKey="tagSort"
					value={activeSort}
					options={sortOptions}
					labels={SORT_LABELS}
					descriptions={SORT_DESCRIPTIONS}
					defaultValue="volume"
					ariaLabelPrefix="Rank tags by"
					transformParams={(params, next) => {
						params.set("tagSort", next);
					}}
					pending={isPending}
					onNavigate={({ href, next }) => {
						window.history.replaceState(window.history.state, "", href);
						startTransition(async () => {
							const result = await getBuilderGlobalTagsAction({
								sort: next,
								timeframe,
							});

							setTagState({
								sourceRows: rows,
								sourceSort: sort,
								sourceTimeframe: timeframe,
								rows: result.rows,
								sort: result.sort,
							});
						});
					}}
				/>
			</div>

			<Card variant="analytics">
				<CardContent>
					<ChartContainer
						config={CHART_CONFIG}
						className="aspect-auto w-full"
						style={{ height: chartHeight }}
					>
						<BarChart
							accessibilityLayer
							data={data}
							layout="vertical"
							margin={{ right: 78 }}
						>
							<CartesianGrid horizontal={false} />
							<YAxis
								dataKey="label"
								type="category"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
								width={112}
								tickFormatter={(value) => String(value)}
							/>
							<XAxis
								dataKey={metric}
								type="number"
								tickLine={false}
								axisLine={false}
								tickFormatter={(value) =>
									formatNumber(Number(value), {
										compact: true,
										currency: isCurrencyMetric,
									})
								}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										indicator="line"
										formatter={(_value, _name, item) => {
											const payload = item?.payload as TagDatum | undefined;
											if (!payload) return null;
											return (
												<div className="grid min-w-56 gap-1.5">
													<Link
														href={`/tags/${payload.slug}` as Route}
														prefetch={false}
														className="font-medium text-foreground underline-offset-4 hover:underline"
													>
														{payload.label}
													</Link>
													<div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
														<span className="text-muted-foreground">Volume</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.volumeUsd, {
																compact: true,
																currency: true,
															})}
														</span>
														<span className="text-muted-foreground">Builder fees</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.builderFeesUsd, {
																compact: true,
																currency: true,
															})}
														</span>
														<span className="text-muted-foreground">Fees</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.feesUsd, {
																compact: true,
																currency: true,
															})}
														</span>
														<span className="text-muted-foreground">Traders</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.uniqueTraders, { compact: true })}
														</span>
														<span className="text-muted-foreground">Trades</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.txnCount, { compact: true })}
														</span>
														<span className="text-muted-foreground">Builders</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.distinctBuilders, { compact: true })}
														</span>
														<span className="text-muted-foreground">New users</span>
														<span className="text-right font-mono tabular-nums">
															{formatNumber(payload.newUsers, { compact: true })}
														</span>
													</div>
												</div>
											);
										}}
									/>
								}
							/>
							<Bar dataKey={metric} fill={`var(--color-${metric})`} radius={4}>
								<LabelList
									dataKey={metric}
									position="right"
									offset={8}
									className="fill-foreground tabular-nums"
									fontSize={12}
									formatter={(value) =>
										formatNumber(Number(value), {
											compact: true,
											currency: isCurrencyMetric,
										})
									}
								/>
							</Bar>
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</section>
	);
}

export function BuildersGlobalTagsFallback() {
	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<Skeleton className="h-5 w-44" />
				<Skeleton className="h-4 w-96 max-w-full" />
			</div>
			<Card variant="analytics">
				<CardContent>
					<Skeleton className="h-[320px] w-full" />
				</CardContent>
			</Card>
		</section>
	);
}
