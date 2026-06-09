"use client"
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
	CandlestickSeries,
	ColorType,
	createChart,
	type CandlestickData,
	type IChartApi,
	type UTCTimestamp,
} from "lightweight-charts"
import { ChartArea, ChartCandlestick, Settings2Icon } from "lucide-react"
import posthog from "posthog-js"
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceDot, useXAxisScale, useYAxisScale, XAxis, YAxis } from "recharts"

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "@/components/ui/external-link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { PnlChartAnnotation, PnlChartExit, PnlDataPoint } from "@/lib/struct/pnl"
import { formatDateCompact, formatDateFull, formatDateTimeFull, pnlColorClass } from "@/lib/format"
import { formatNumber } from "@/lib/format"
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url"
import type { PnlTimeframe } from "@/lib/struct/pnl-timeframes"
import { cn } from "@/lib/utils"

export type PnlChartMode = "area" | "candles"

const chartConfig = {
	pnlRange: {
		label: "Open to close",
		color: "var(--chart-1)",
	},
	pnl: {
		label: "PnL",
		color: "var(--chart-1)",
	},
	metric: {
		label: "Metric",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig

type PnlChartPoint = PnlDataPoint & {
	range: [number, number]
	metric: number
}

export type PnlChartOhlcMetric = "pnl" | "realized" | "unrealized" | "portfolio"
export type PnlChartMetric = PnlChartOhlcMetric | "usdBalance" | "openPositions"

const chartMetricOptions = [
	{ value: "pnl", label: "PnL", short: "PnL" },
	{ value: "realized", label: "Realized PnL", short: "Realized" },
	{ value: "unrealized", label: "Unrealized PnL", short: "Unrealized" },
	{ value: "portfolio", label: "Portfolio Value", short: "Portfolio" },
	{ value: "usdBalance", label: "USD Balance", short: "Balance" },
	{ value: "openPositions", label: "Open Positions", short: "Positions" },
] satisfies Array<{ value: PnlChartMetric; label: string; short: string }>

const annotationConfig = {
	best: {
		color: "#10b981",
		bandFill: "rgba(16, 185, 129, 0.12)",
		bandStroke: "rgba(16, 185, 129, 0.45)",
		badgeClassName: "border-emerald-500/20 bg-emerald-500/10",
		valueClassName: "text-emerald-600 dark:text-emerald-400",
	},
	worst: {
		color: "#ef4444",
		bandFill: "rgba(239, 68, 68, 0.12)",
		bandStroke: "rgba(239, 68, 68, 0.45)",
		badgeClassName: "border-red-500/20 bg-red-500/10",
		valueClassName: "text-red-600 dark:text-red-400",
	},
} satisfies Record<
	PnlChartAnnotation["kind"],
	{
		color: string
		bandFill: string
		bandStroke: string
		badgeClassName: string
		valueClassName: string
	}
>

const windowLabels = {
	day: "day",
	week: "week",
	month: "month",
} satisfies Record<PnlChartAnnotation["window"], string>

function getAnnotationLabel(annotation: PnlChartAnnotation): string {
	const prefix = annotation.kind === "best" ? "Best" : "Worst"
	return `${prefix} ${windowLabels[annotation.window]}`
}

function annotationKey(annotation: PnlChartAnnotation): string {
	return `${annotation.kind}-${annotation.window}-${annotation.from}`
}

function AnnotationBadge({ annotation }: { annotation: PnlChartAnnotation }) {
	const tone = annotationConfig[annotation.kind]

	return (
		<div
			className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs backdrop-blur-md", tone.badgeClassName)}
		>
			<span className={cn("font-medium", tone.valueClassName)}>{getAnnotationLabel(annotation)}</span>
			<span className="text-foreground/80">{annotation.date}</span>
			<span className={cn("font-medium", tone.valueClassName)}>
				{formatNumber(annotation.change, { currency: true, compact: true })}
			</span>
		</div>
	)
}

type AnnotationDotShapeProps = {
	annotationKind: PnlChartAnnotation["kind"]
	cx?: number
	cy?: number
	r?: number | string
	fill?: string
	stroke?: string
	strokeWidth?: number | string
}

function AnnotationDotShape({
	annotationKind,
	cx,
	cy,
	r = 6,
	fill,
	stroke,
	strokeWidth,
}: AnnotationDotShapeProps) {
	if (typeof cx !== "number" || typeof cy !== "number") {
		return <g />
	}

	const tone = annotationConfig[annotationKind]

	return (
		<circle cx={cx} cy={cy} r={r} fill={fill ?? tone.color} stroke={stroke} strokeWidth={strokeWidth} />
	)
}

const EXIT_BUBBLE_SIZE = 30

function exitCloseLabel(reason: PnlChartExit["reason"]): string {
	return reason === "resolved_win" || reason === "resolved_loss" ? "Resolved" : "Sold"
}

const EXIT_SIGNIFICANCE_RATIO = 0.02

function filterSignificantExits(exits: PnlChartExit[]): PnlChartExit[] {
	if (exits.length === 0) return exits

	const maxAbs = exits.reduce((max, exit) => Math.max(max, Math.abs(exit.pnlUsd)), 0)
	if (maxAbs === 0) return exits

	const threshold = maxAbs * EXIT_SIGNIFICANCE_RATIO
	return exits.filter((exit) => Math.abs(exit.pnlUsd) >= threshold)
}

type ExitDot = {
	exit: PnlChartExit
	x: number
	y: number
}

function snapExitsToChart(exits: PnlChartExit[], chartData: PnlChartPoint[]): ExitDot[] {
	if (chartData.length === 0) return []

	const first = chartData[0].t
	const last = chartData[chartData.length - 1].t

	return exits
		.filter((exit) => exit.t >= first && exit.t <= last)
		.map((exit) => {
			let nearest = chartData[0]
			let nearestDiff = Math.abs(chartData[0].t - exit.t)

			for (const point of chartData) {
				const diff = Math.abs(point.t - exit.t)
				if (diff < nearestDiff) {
					nearestDiff = diff
					nearest = point
				}
			}

			return { exit, x: nearest.t, y: nearest.metric }
		})
}

function ExitClusterList({ exits, timezone }: { exits: PnlChartExit[]; timezone?: string }) {
	const net = exits.reduce((sum, exit) => sum + exit.pnlUsd, 0)

	return (
		<div className="flex flex-col overflow-hidden rounded-lg">
			{exits.length > 1 ? (
				<div className="flex items-center justify-between gap-4 border-b px-3 py-2">
					<span className="text-xs font-medium text-muted-foreground">{exits.length} exits</span>
					<span className={cn("text-xs font-medium tabular-nums", pnlColorClass(net))}>
						Net {formatNumber(net, { currency: true, compact: true })}
					</span>
				</div>
			) : null}
			<div className="max-h-72 overflow-y-auto overscroll-contain">
				{exits.map((exit, index) => (
					<ExitClusterRow
						key={`${exit.t}-${exit.marketSlug ?? exit.question}-${index}`}
						exit={exit}
						timezone={timezone}
					/>
				))}
			</div>
		</div>
	)
}

function ExitClusterRow({ exit, timezone }: { exit: PnlChartExit; timezone?: string }) {
	const isWin = exit.pnlUsd >= 0
	const href = exit.marketSlug ? `https://polymarket.com/market/${exit.marketSlug}` : null
	const image = exit.imageUrl ? normalizePolymarketS3ImageUrl(exit.imageUrl) : null
	const className = "flex items-start gap-2.5 px-3 py-2.5"

	const content = (
		<>
			{image ? (
				<img
					className={cn(
						"size-9 shrink-0 rounded-md border-2 object-cover",
						isWin ? "border-emerald-500" : "border-red-500",
					)}
					alt=""
					src={image}
				/>
			) : (
				<div
					className={cn(
						"size-9 shrink-0 rounded-md border-2 bg-muted",
						isWin ? "border-emerald-500" : "border-red-500",
					)}
				/>
			)}
			<div className="min-w-0 flex-1">
				<p className="truncate text-xs font-medium leading-snug">{exit.question}</p>
				<div className="mt-1 flex flex-wrap items-center gap-1.5">
					{exit.outcome ? (
						<Badge
							variant={
								exit.outcomeIndex === 0 ? "positive" : exit.outcomeIndex === 1 ? "negative" : "secondary"
							}
						>
							{exit.outcome}
						</Badge>
					) : null}
					<Badge variant="outline">{exitCloseLabel(exit.reason)}</Badge>
					<span className="text-[10px] text-muted-foreground">{formatDateFull(exit.t, timezone)}</span>
				</div>
			</div>
			<div className="shrink-0 text-right">
				<p className={cn("text-xs font-medium tabular-nums", pnlColorClass(exit.pnlUsd))}>
					{formatNumber(exit.pnlUsd, { currency: true, compact: true })}
				</p>
				{exit.pnlPct != null ? (
					<p className="text-[10px] tabular-nums text-muted-foreground">
						{formatNumber(exit.pnlPct, { percent: true })}
					</p>
				) : null}
			</div>
		</>
	)

	if (href) {
		return (
			<ExternalLink href={href} linkType="polymarket_market" className={cn(className, "transition-colors hover:bg-muted")}>
				{content}
			</ExternalLink>
		)
	}

	return <div className={className}>{content}</div>
}

const EXIT_STACK_PITCH = 26
const EXIT_CLUSTER_THRESHOLD = EXIT_BUBBLE_SIZE
const EXIT_STACK_OVERLAP = EXIT_BUBBLE_SIZE - EXIT_STACK_PITCH
const EXIT_PREVIEW_MAX = 3
const EXIT_BUBBLE_MARGIN = EXIT_BUBBLE_SIZE / 2
const EXIT_BUBBLE_EDGE_PADDING = 8
const EXIT_PLOT_INSET_RIGHT = 60
const EXIT_PLOT_INSET_BOTTOM = 28

type ChartBounds = {
	left: number
	right: number
	top: number
	bottom: number
}

type ExitPosition = {
	exit: PnlChartExit
	cx: number
	cy: number
}

type ExitClusterData = {
	exits: PnlChartExit[]
	tone: "win" | "loss" | "mixed"
	cx: number
	cy: number
}

function previewRowCount(total: number): number {
	return total <= EXIT_PREVIEW_MAX ? total : EXIT_PREVIEW_MAX
}

function groupExitClusters(positions: ExitPosition[], bounds: ChartBounds | null): ExitClusterData[] {
	if (positions.length === 0) return []

	const sorted = [...positions].sort((a, b) => a.cx - b.cx)
	const clusters: ExitClusterData[] = []

	let cluster: ExitPosition[] = []
	let anchorCx = sorted[0].cx

	const flush = () => {
		if (cluster.length === 0) return

		const avgCx = cluster.reduce((sum, pos) => sum + pos.cx, 0) / cluster.length
		const avgCy = cluster.reduce((sum, pos) => sum + pos.cy, 0) / cluster.length

		const exits = cluster.map((pos) => pos.exit).sort((a, b) => b.pnlUsd - a.pnlUsd)
		const wins = cluster.filter((pos) => pos.exit.pnlUsd >= 0).length
		const tone: "win" | "loss" | "mixed" = wins === cluster.length ? "win" : wins === 0 ? "loss" : "mixed"

		const rows = previewRowCount(exits.length)
		const stackHeight = rows * EXIT_BUBBLE_SIZE - (rows - 1) * EXIT_STACK_OVERLAP
		const halfHeight = stackHeight / 2

		let cx = avgCx
		let cy = avgCy
		if (bounds) {
			cx = Math.min(Math.max(avgCx, bounds.left + EXIT_BUBBLE_MARGIN), bounds.right - EXIT_BUBBLE_MARGIN)
			const minAllowed = bounds.top + EXIT_BUBBLE_EDGE_PADDING + halfHeight
			const maxAllowed = bounds.bottom - EXIT_BUBBLE_EDGE_PADDING - halfHeight
			cy = Math.min(Math.max(avgCy, minAllowed), maxAllowed)
		}

		clusters.push({ exits, tone, cx, cy })
		cluster = []
	}

	for (const pos of sorted) {
		if (cluster.length > 0 && pos.cx - anchorCx > EXIT_CLUSTER_THRESHOLD) {
			flush()
			anchorCx = pos.cx
		}
		if (cluster.length === 0) anchorCx = pos.cx
		cluster.push(pos)
	}
	flush()

	return clusters
}

function ExitScaleProbe({
	exitDots,
	onResolve,
}: {
	exitDots: ExitDot[]
	onResolve: (positions: ExitPosition[]) => void
}) {
	const xScale = useXAxisScale()
	const yScale = useYAxisScale()

	const positions: ExitPosition[] = []
	if (xScale && yScale) {
		for (const dot of exitDots) {
			const cx = xScale(dot.x, { position: "middle" })
			const cy = yScale(dot.y)
			if (typeof cx === "number" && typeof cy === "number" && Number.isFinite(cx) && Number.isFinite(cy)) {
				positions.push({ exit: dot.exit, cx, cy })
			}
		}
	}

	const signature = positions.map((p) => `${p.exit.t}:${Math.round(p.cx)}:${Math.round(p.cy)}`).join("|")

	useEffect(() => {
		onResolve(positions)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [signature])

	return null
}

function ExitPreviewBubble({ exit, style }: { exit: PnlChartExit; style?: CSSProperties }) {
	const isWin = exit.pnlUsd >= 0
	const image = exit.imageUrl ? normalizePolymarketS3ImageUrl(exit.imageUrl) : null

	return (
		<span
			className={cn(
				"block overflow-hidden rounded-full border-2 bg-card shadow-md",
				isWin ? "border-emerald-500" : "border-red-500",
			)}
			style={{ width: EXIT_BUBBLE_SIZE, height: EXIT_BUBBLE_SIZE, ...style }}
		>
			{image ? (
				<img src={image} alt="" className="size-full object-cover" />
			) : (
				<span className={cn("block size-full", isWin ? "bg-emerald-500/20" : "bg-red-500/20")} />
			)}
		</span>
	)
}

function ExitCountBubble({ count, tone, style }: { count: number; tone: "win" | "loss" | "mixed"; style?: CSSProperties }) {
	return (
		<span
			className={cn(
				"flex items-center justify-center rounded-full border-2 bg-card text-[11px] font-semibold tabular-nums shadow-md",
				tone === "win"
					? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
					: tone === "loss"
						? "border-red-500 text-red-600 dark:text-red-400"
						: "border-border text-muted-foreground",
			)}
			style={{ width: EXIT_BUBBLE_SIZE, height: EXIT_BUBBLE_SIZE, ...style }}
		>
			+{count}
		</span>
	)
}

function ExitCluster({ cluster, timezone, style }: { cluster: ExitClusterData; timezone?: string; style?: CSSProperties }) {
	const { exits, tone } = cluster
	const showAll = exits.length <= EXIT_PREVIEW_MAX
	const previewExits = showAll ? exits : exits.slice(0, EXIT_PREVIEW_MAX - 1)
	const remaining = exits.length - previewExits.length
	const rows = previewExits.length + (remaining > 0 ? 1 : 0)

	return (
		<div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={style}>
			<Popover>
				<PopoverTrigger
					render={
						<button
							type="button"
							aria-label={exits.length === 1 ? `Exit: ${exits[0].question}` : `${exits.length} exits`}
							className="group pointer-events-auto flex flex-col items-center outline-none transition-transform hover:scale-105 focus-visible:scale-105"
						>
							{previewExits.map((exit, index) => (
								<ExitPreviewBubble
									key={`${exit.t}-${exit.marketSlug ?? exit.question}-${index}`}
									exit={exit}
									style={{ marginTop: index === 0 ? 0 : -EXIT_STACK_OVERLAP, zIndex: rows - index }}
								/>
							))}
							{remaining > 0 ? (
								<ExitCountBubble count={remaining} tone={tone} style={{ marginTop: -EXIT_STACK_OVERLAP, zIndex: 0 }} />
							) : null}
						</button>
					}
				/>
				<PopoverContent align="center" side="top" className="w-72 p-0">
					<ExitClusterList exits={exits} timezone={timezone} />
				</PopoverContent>
			</Popover>
		</div>
	)
}

function getChartMetricValue(point: PnlDataPoint, metric: PnlChartMetric) {
	if (metric === "portfolio") return point.portfolioClose
	if (metric === "realized") return point.realizedClose
	if (metric === "unrealized") return point.unrealizedClose
	if (metric === "usdBalance") return point.usdBalance
	if (metric === "openPositions") return point.numOpenPositions
	return point.p
}

export function isOhlcMetric(metric: PnlChartMetric): metric is PnlChartOhlcMetric {
	return metric === "pnl" || metric === "realized" || metric === "unrealized" || metric === "portfolio"
}

function getChartMetricOhlc(point: PnlDataPoint, metric: PnlChartOhlcMetric) {
	if (metric === "portfolio") {
		return {
			open: point.portfolioOpen,
			high: point.portfolioHigh,
			low: point.portfolioLow,
			close: point.portfolioClose,
		}
	}

	if (metric === "realized") {
		return {
			open: point.realizedOpen,
			high: point.realizedHigh,
			low: point.realizedLow,
			close: point.realizedClose,
		}
	}

	if (metric === "unrealized") {
		return {
			open: point.unrealizedOpen,
			high: point.unrealizedHigh,
			low: point.unrealizedLow,
			close: point.unrealizedClose,
		}
	}

	return {
		open: point.open,
		high: point.high,
		low: point.low,
		close: point.close,
	}
}

function formatChartMetricValue(value: number, metric: PnlChartMetric) {
	if (metric === "openPositions") return formatNumber(value, { decimals: 0 })
	return formatNumber(value, { currency: true, compact: true })
}

function toChartPoint(point: PnlDataPoint, metric: PnlChartMetric): PnlChartPoint {
	const ohlc = isOhlcMetric(metric) ? getChartMetricOhlc(point, metric) : null

	return {
		...point,
		range: ohlc ? [Math.min(ohlc.open, ohlc.close), Math.max(ohlc.open, ohlc.close)] : [getChartMetricValue(point, metric), getChartMetricValue(point, metric)],
		metric: getChartMetricValue(point, metric),
	}
}

export type TooltipFieldKey =
	| "open"
	| "high"
	| "low"
	| "close"
	| "change"
	| "realized"
	| "unrealized"
	| "portfolio"
	| "usdBalance"
	| "openPositions"

export const tooltipFieldOptions = [
	{ key: "close", label: "Close" },
	{ key: "change", label: "Change" },
	{ key: "open", label: "Open" },
	{ key: "high", label: "High" },
	{ key: "low", label: "Low" },
	{ key: "realized", label: "Realized PnL" },
	{ key: "unrealized", label: "Unrealized PnL" },
	{ key: "portfolio", label: "Portfolio value" },
	{ key: "usdBalance", label: "USD balance" },
	{ key: "openPositions", label: "Open positions" },
] satisfies Array<{ key: TooltipFieldKey; label: string }>

export const defaultTooltipFields: TooltipFieldKey[] = ["close", "change", "realized", "unrealized", "openPositions"]

function getTooltipFieldValue(entry: PnlChartPoint, key: TooltipFieldKey): { value: number; valueClassName?: string; currency: boolean } {
	switch (key) {
		case "open":
			return { value: entry.open, currency: true }
		case "high":
			return { value: entry.high, currency: true }
		case "low":
			return { value: entry.low, currency: true }
		case "close":
			return { value: entry.close, currency: true }
		case "change": {
			const change = entry.close - entry.open
			return { value: change, valueClassName: pnlColorClass(change), currency: true }
		}
		case "realized":
			return { value: entry.realizedClose, valueClassName: pnlColorClass(entry.realizedClose), currency: true }
		case "unrealized":
			return { value: entry.unrealizedClose, valueClassName: pnlColorClass(entry.unrealizedClose), currency: true }
		case "portfolio":
			return { value: entry.portfolioClose, currency: true }
		case "usdBalance":
			return { value: entry.usdBalance, currency: true }
		case "openPositions":
			return { value: entry.numOpenPositions, currency: false }
	}
}

function PnlTooltipContent({
	active,
	payload,
	showTime,
	timezone,
	fields = defaultTooltipFields,
}: {
	active?: boolean
	payload?: Array<{ payload?: PnlChartPoint }>
	showTime: boolean
	timezone?: string
	fields?: TooltipFieldKey[]
}) {
	const entry = payload?.[0]?.payload

	if (!active || !entry) {
		return null
	}

	const selected = new Set(fields)
	const visibleFields = tooltipFieldOptions.filter((option) => selected.has(option.key))

	return (
		<div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
			<div className="font-medium">
				{showTime ? formatDateTimeFull(entry.t, timezone) : formatDateFull(entry.t, timezone)}
			</div>
			{visibleFields.length > 0 ? (
				<div className="grid gap-1.5">
					{visibleFields.map((option) => {
						const { value, valueClassName, currency } = getTooltipFieldValue(entry, option.key)
						return (
							<TooltipValue
								key={option.key}
								label={option.label}
								value={value}
								valueClassName={valueClassName}
								currency={currency}
							/>
						)
					})}
				</div>
			) : null}
		</div>
	)
}

function TooltipValue({
	label,
	value,
	valueClassName,
	currency = true,
}: {
	label: string
	value: number
	valueClassName?: string
	currency?: boolean
}) {
	return (
		<div className="flex items-center justify-between gap-4 leading-none">
			<span className="text-muted-foreground">{label}</span>
			<span className={cn("shrink-0 font-mono font-medium text-foreground tabular-nums", valueClassName)}>
				{formatNumber(value, currency ? { currency: true } : { decimals: 0 })}
			</span>
		</div>
	)
}

export function ChartModeToggle({ value, onChange }: { value: PnlChartMode; onChange: (value: PnlChartMode) => void }) {
	return (
		<ToggleGroup
			value={[value]}
			onValueChange={(nextValue) => {
				const next = Array.isArray(nextValue) ? nextValue[0] : nextValue
				if (next === "area" || next === "candles") {
					posthog.capture("trader_pnl_chart_mode_changed", { mode: next })
					onChange(next)
				}
			}}
			variant="outline"
			size="sm"
			spacing={0}
			aria-label="PnL chart mode"
		>
			<ToggleGroupItem value="area" aria-label="Show area chart" title="Area chart">
				<ChartArea aria-hidden="true" className="size-4" />
				<span className="sr-only">Area</span>
			</ToggleGroupItem>
			<ToggleGroupItem value="candles" aria-label="Show candlestick chart" title="Candlestick chart">
				<ChartCandlestick aria-hidden="true" className="size-4" />
				<span className="sr-only">Candles</span>
			</ToggleGroupItem>
		</ToggleGroup>
	)
}

export function PnlMetricTabs({
	value,
	onChange,
	chartMode,
}: {
	value: PnlChartMetric
	onChange: (value: PnlChartMetric) => void
	chartMode: PnlChartMode
}) {
	return (
		<Tabs
			value={value}
			onValueChange={(next) => {
				if (typeof next === "string") {
					posthog.capture("trader_pnl_chart_metric_changed", {
						metric: next,
						previous_metric: value,
					})
					onChange(next as PnlChartMetric)
				}
			}}
			className="min-w-0 flex-1"
		>
			<TabsList variant="line" className="w-full justify-start gap-4 overflow-x-auto">
				{chartMetricOptions.map((option) => (
					<TabsTrigger
						key={option.value}
						value={option.value}
						disabled={chartMode === "candles" && !isOhlcMetric(option.value)}
						title={option.label}
						className="flex-none px-0.5"
					>
						{option.short}
					</TabsTrigger>
				))}
			</TabsList>
		</Tabs>
	)
}

export function ChartSettingsButton({
	exitsDisabled = false,
	highlightsAvailable = false,
	highlightsActive = false,
	onHighlightsChange,
	winExitsAvailable = false,
	winExitsActive = false,
	onWinExitsChange,
	lossExitsAvailable = false,
	lossExitsActive = false,
	onLossExitsChange,
	fillGapsActive = true,
	onFillGapsChange,
	tooltipFields = defaultTooltipFields,
	onTooltipFieldChange,
}: {
	exitsDisabled?: boolean
	highlightsAvailable?: boolean
	highlightsActive?: boolean
	onHighlightsChange?: (next: boolean) => void
	winExitsAvailable?: boolean
	winExitsActive?: boolean
	onWinExitsChange?: (next: boolean) => void
	lossExitsAvailable?: boolean
	lossExitsActive?: boolean
	onLossExitsChange?: (next: boolean) => void
	fillGapsActive?: boolean
	onFillGapsChange?: (next: boolean) => void
	tooltipFields?: TooltipFieldKey[]
	onTooltipFieldChange?: (key: TooltipFieldKey, next: boolean) => void
}) {
	const hasOverlays =
		(highlightsAvailable && onHighlightsChange) ||
		(winExitsAvailable && onWinExitsChange) ||
		(lossExitsAvailable && onLossExitsChange) ||
		Boolean(onFillGapsChange)

	if (!hasOverlays && !onTooltipFieldChange) return null

	const activeTooltipFields = new Set(tooltipFields)

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="outline" size="icon-sm" className="rounded-full" aria-label="Chart settings" title="Chart settings">
						<Settings2Icon aria-hidden="true" className="size-4" />
					</Button>
				}
			/>
			<PopoverContent align="end" className="max-h-[70vh] w-56 overflow-y-auto p-2">
				<div className="grid gap-3">
					{hasOverlays ? (
						<div className="grid gap-1.5">
							<div className="px-1 text-xs text-muted-foreground">Overlays</div>
							{highlightsAvailable && onHighlightsChange ? (
								<ToggleRow
									label="Best / worst period"
									active={highlightsActive}
									onChange={onHighlightsChange}
								/>
							) : null}
							{winExitsAvailable && onWinExitsChange ? (
								<ToggleRow
									label="Best wins"
									active={winExitsActive}
									onChange={onWinExitsChange}
									disabled={exitsDisabled}
									dotClassName="bg-emerald-500"
								/>
							) : null}
							{lossExitsAvailable && onLossExitsChange ? (
								<ToggleRow
									label="Worst losses"
									active={lossExitsActive}
									onChange={onLossExitsChange}
									disabled={exitsDisabled}
									dotClassName="bg-red-500"
								/>
							) : null}
							{onFillGapsChange ? (
								<ToggleRow
									label="Fill gaps"
									active={fillGapsActive}
									onChange={onFillGapsChange}
								/>
							) : null}
						</div>
					) : null}
					{onTooltipFieldChange ? (
						<div className={cn("grid gap-1.5", hasOverlays && "border-t pt-2")}>
							<div className="px-1 text-xs text-muted-foreground">Tooltip fields</div>
							{tooltipFieldOptions.map((option) => (
								<ToggleRow
									key={option.key}
									label={option.label}
									active={activeTooltipFields.has(option.key)}
									onChange={(next) => onTooltipFieldChange(option.key, next)}
								/>
							))}
						</div>
					) : null}
				</div>
			</PopoverContent>
		</Popover>
	)
}

function ToggleRow({
	label,
	active,
	onChange,
	disabled = false,
	dotClassName,
}: {
	label: string
	active: boolean
	onChange: (next: boolean) => void
	disabled?: boolean
	dotClassName?: string
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!active)}
			aria-pressed={active}
			disabled={disabled}
			className={cn(
				"flex items-center justify-between rounded-sm px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
				active ? "bg-muted text-foreground" : "text-muted-foreground",
			)}
		>
			<span className="flex items-center gap-1.5">
				{dotClassName ? <span className={cn("size-2 rounded-full", dotClassName)} /> : null}
				{label}
			</span>
			<span className={cn("text-[10px] font-medium", active ? "text-emerald-500" : "text-muted-foreground")}>
				{active ? "ON" : "OFF"}
			</span>
		</button>
	)
}

function toCandlestickData(data: PnlDataPoint[], metric: PnlChartOhlcMetric): CandlestickData<UTCTimestamp>[] {
	return data.map((point) => ({
		time: point.t as UTCTimestamp,
		...getChartMetricOhlc(point, metric),
	}))
}

function getCandlestickThemeColors() {
	const isDark = document.documentElement.classList.contains("dark")

	return {
		background: isDark ? "#191919" : "#f4f4f4",
		text: isDark ? "#a3a3a3" : "#737373",
		grid: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(0, 0, 0, 0.10)",
	}
}

function PnlCandlestickChart({ data, metric, timezone }: { data: PnlDataPoint[]; metric: PnlChartOhlcMetric; timezone?: string }) {
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const colors = getCandlestickThemeColors()
		const chart: IChartApi = createChart(container, {
			autoSize: true,
			layout: {
				background: { type: ColorType.Solid, color: colors.background },
				textColor: colors.text,
				attributionLogo: false,
			},
			grid: {
				vertLines: { visible: false },
				horzLines: { color: colors.grid },
			},
			rightPriceScale: {
				borderVisible: false,
				scaleMargins: { top: 0.08, bottom: 0.08 },
			},
			timeScale: {
				borderVisible: false,
				timeVisible: true,
				secondsVisible: false,
				fixLeftEdge: true,
				fixRightEdge: true,
			},
			crosshair: {
				vertLine: { color: colors.grid },
				horzLine: { color: colors.grid },
			},
			localization: {
				priceFormatter: (value: number) => formatNumber(value, { currency: true }),
				timeFormatter: (time: number) => formatDateTimeFull(time, timezone),
			},
		})
		const series = chart.addSeries(CandlestickSeries, {
			upColor: "#10b981",
			downColor: "#ef4444",
			borderUpColor: "#10b981",
			borderDownColor: "#ef4444",
			wickUpColor: "#10b981",
			wickDownColor: "#ef4444",
		})

		series.setData(toCandlestickData(data, metric))
		chart.timeScale().fitContent()

		return () => {
			chart.remove()
		}
	}, [data, metric, timezone])

	return <div ref={containerRef} className="h-[320px] min-h-[320px] w-full sm:h-[420px] sm:min-h-[390px]" />
}

export function PnlChart({
	data,
	annotations,
	showAnnotations,
	timeframe,
	timezone,
	showTooltipTime,
}: {
	data: PnlDataPoint[]
	annotations?: PnlChartAnnotation[]
	showAnnotations?: boolean
	timeframe?: PnlTimeframe
	timezone?: string
	showTooltipTime?: boolean
}) {
	return (
		<PnlChartContent
			data={data}
			annotations={annotations}
			showAnnotations={showAnnotations}
			timeframe={timeframe}
			timezone={timezone}
			showTooltipTime={showTooltipTime}
		/>
	)
}

type PnlChartProps = {
	data: PnlDataPoint[]
	annotations?: PnlChartAnnotation[]
	showAnnotations?: boolean
	exits?: PnlChartExit[]
	showWinExits?: boolean
	showLossExits?: boolean
	timeframe?: PnlTimeframe
	timezone?: string
	showTooltipTime?: boolean
	action?: ReactNode
	toolbar?: ReactNode
	chartMode?: PnlChartMode
	chartMetric?: PnlChartMetric
	tooltipFields?: TooltipFieldKey[]
}

export function PnlChartContent({ data, annotations = [], showAnnotations = false, exits = [], showWinExits = false, showLossExits = false, timeframe, timezone, showTooltipTime, action, toolbar, chartMode = "area", chartMetric = "pnl", tooltipFields = defaultTooltipFields }: PnlChartProps) {
	const [exitPositions, setExitPositions] = useState<ExitPosition[]>([])
	const [exitBounds, setExitBounds] = useState<ChartBounds | null>(null)
	const chartAreaRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const element = chartAreaRef.current
		if (!element || typeof ResizeObserver === "undefined") return

		const measure = () => {
			setExitBounds({
				left: 0,
				right: element.clientWidth - EXIT_PLOT_INSET_RIGHT,
				top: 0,
				bottom: element.clientHeight - EXIT_PLOT_INSET_BOTTOM,
			})
		}

		measure()
		const observer = new ResizeObserver(measure)
		observer.observe(element)
		return () => observer.disconnect()
	}, [])

	if (data.length === 0) {
		return (
			<div className="overflow-hidden">
				<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="mb-1 text-sm text-foreground">Cumulative PnL</p>
						<p className="text-xl font-medium text-muted-foreground sm:text-2xl">$0.00</p>
					</div>
					{action ? (
						<div className="w-full sm:w-auto sm:shrink-0" data-share-ignore="true">
							{action}
						</div>
					) : null}
				</div>
				<div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground sm:h-[420px]">
					No PnL data available
				</div>
			</div>
		)
	}

	const lastPnl = data[data.length - 1].p
	const firstPnl = data[0].open
	const change = lastPnl - firstPnl
	const latestOpenPositions = data[data.length - 1].numOpenPositions
	const chartData = data.map((point) => toChartPoint(point, chartMetric))
	const hasAnnotations = annotations.length > 0
	const visibleAnnotations = chartMode === "area" && chartMetric === "pnl" && showAnnotations ? annotations : []
	const exitsEligible = chartMode === "area" && chartMetric === "pnl"
	const visibleExits = exitsEligible
		? filterSignificantExits(exits.filter((exit) => (exit.pnlUsd >= 0 ? showWinExits : showLossExits)))
		: []
	const exitDots = snapExitsToChart(visibleExits, chartData)
	const shouldShowTooltipTime = showTooltipTime ?? timeframe !== undefined
	const showMetricRange = isOhlcMetric(chartMetric)
	const candlestickMetric = isOhlcMetric(chartMetric) ? chartMetric : "pnl"

	return (
		<div className="overflow-hidden">
			<div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between group-data-[share-mode=image]/share-card:mb-6 group-data-[share-mode=image]/share-card:items-end", toolbar ? "mb-5" : "mb-8")}>
				<div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:shrink-0 sm:gap-5">
					<PnlSummaryMetric
						label="Cumulative PnL"
						value={formatNumber(lastPnl, { currency: true, compact: true })}
						valueClassName={pnlColorClass(lastPnl)}
					/>
					<PnlSummaryMetric
						label="Change"
						value={formatNumber(change, { currency: true, compact: true })}
						valueClassName={pnlColorClass(change)}
					/>
					<PnlSummaryMetric
						label="Open Positions"
						value={formatNumber(latestOpenPositions, { decimals: 0 })}
					/>
				</div>
				<div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
					{hasAnnotations ? (
						<div
							aria-hidden={!showAnnotations}
							className={cn(
								"hidden flex-wrap gap-2 group-data-[share-mode=image]/share-card:flex",
								showAnnotations ? "opacity-100" : "opacity-0 pointer-events-none"
							)}
						>
							{annotations.map((annotation) => (
								<AnnotationBadge key={annotationKey(annotation)} annotation={annotation} />
							))}
						</div>
					) : null}
					{action ? (
						<div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end sm:shrink-0 group-data-[share-mode=image]/share-card:hidden" data-share-ignore="true">
							{action}
						</div>
					) : null}
				</div>
			</div>
			{toolbar ? (
				<div
					className="mb-6 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 group-data-[share-mode=image]/share-card:hidden"
					data-share-ignore="true"
				>
					{toolbar}
				</div>
			) : null}
			{hasAnnotations ? (
				<div
					aria-hidden={!showAnnotations}
					className={cn(
						"grid overflow-hidden transition-[grid-template-rows,margin,opacity] duration-200 ease-out motion-reduce:transition-none group-data-[share-mode=image]/share-card:hidden",
						showAnnotations ? "mb-4 grid-rows-[1fr] opacity-100" : "mb-0 grid-rows-[0fr] opacity-0 pointer-events-none"
					)}
				>
					<div className="min-h-0">
						<div
							className={cn(
								"flex flex-wrap gap-2 overflow-hidden pt-0.5 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
								showAnnotations ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
							)}
						>
							{annotations.map((annotation) => (
								<AnnotationBadge key={annotationKey(annotation)} annotation={annotation} />
							))}
						</div>
					</div>
				</div>
			) : null}
			<div ref={chartAreaRef} className="relative">
				{chartMode === "candles" ? (
					<PnlCandlestickChart data={data} metric={candlestickMetric} timezone={timezone} />
				) : (
					<>
					<ChartContainer config={chartConfig} className="h-[320px] min-h-[320px] w-full sm:h-[420px] sm:min-h-[390px]">
						<AreaChart accessibilityLayer data={chartData} margin={{ left: 0, right: 60, top: 0, bottom: 0 }}>
						<defs>
							<linearGradient id="pnlRangeGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="var(--color-pnlRange)" stopOpacity={0.12} />
								<stop offset="100%" stopColor="var(--color-pnlRange)" stopOpacity={0.04} />
							</linearGradient>
							<linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="var(--color-pnl)" stopOpacity={0.3} />
								<stop offset="100%" stopColor="var(--color-pnl)" stopOpacity={0.02} />
							</linearGradient>
						</defs>
						<CartesianGrid stroke="var(--color-border)" strokeOpacity={0.5} vertical={false} />
						<XAxis
							dataKey="t"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => formatDateCompact(Number(value), timezone)}
							minTickGap={24}
							tick={{ fontSize: 12 }}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							orientation="right"
							tickMargin={6}
							tickFormatter={(value) => formatChartMetricValue(Number(value), chartMetric)}
							tick={{ fontSize: 12 }}
							width={10}
							domain={["dataMin", "dataMax"]}
						/>
						<ChartTooltip
							wrapperStyle={{ zIndex: 30 }}
							content={
								<PnlTooltipContent showTime={shouldShowTooltipTime} timezone={timezone} fields={tooltipFields} />
							}
						/>
						<Area
							dataKey="metric"
							type="monotone"
							fill="url(#pnlGradient)"
							stroke="none"
							activeDot={false}
							isAnimationActive={false}
						/>
						{showMetricRange ? (
							<Area
								dataKey="range"
								type="monotone"
								fill="url(#pnlRangeGradient)"
								stroke="none"
								activeDot={false}
								isAnimationActive={false}
							/>
						) : null}
						{visibleAnnotations
							.filter((annotation) => annotation.window !== "day")
							.map((annotation) => {
								const tone = annotationConfig[annotation.kind]
								return (
									<ReferenceArea
										key={annotationKey(annotation)}
										x1={annotation.from}
										x2={annotation.to}
										fill={tone.bandFill}
										fillOpacity={1}
										stroke={tone.bandStroke}
										strokeOpacity={1}
										strokeWidth={1}
										ifOverflow="visible"
									/>
								)
							})}
						<Line
							dataKey="metric"
							type="monotone"
							dot={false}
							stroke="var(--color-pnl)"
							strokeWidth={2}
							isAnimationActive={false}
						/>
						{visibleAnnotations
							.filter((annotation) => annotation.window === "day")
							.map((annotation) => {
								const tone = annotationConfig[annotation.kind]
								return (
									<ReferenceDot
										key={annotationKey(annotation)}
										x={annotation.from}
										y={annotation.p}
										r={6}
										fill={tone.color}
										stroke="var(--color-background)"
										strokeWidth={2.5}
										ifOverflow="visible"
										shape={(props) => <AnnotationDotShape {...props} annotationKind={annotation.kind} />}
									/>
								)
							})}
						<ExitScaleProbe exitDots={exitDots} onResolve={setExitPositions} />
						</AreaChart>
					</ChartContainer>
					{exitPositions.length > 0 ? (
						<div className="pointer-events-none absolute inset-0">
							{groupExitClusters(exitPositions, exitBounds).map((cluster, index) => (
								<ExitCluster
									key={`exit-cluster-${index}-${Math.round(cluster.cx)}`}
									cluster={cluster}
									timezone={timezone}
									style={{ left: cluster.cx, top: cluster.cy }}
								/>
							))}
						</div>
					) : null}
					</>
				)}
			</div>
		</div>
	)
}

function PnlSummaryMetric({
	label,
	value,
	valueClassName,
}: {
	label: string
	value: string
	valueClassName?: string
}) {
	return (
		<div>
			<p className="mb-1 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">{label}</p>
			<p className={cn("text-lg font-medium tabular-nums sm:text-2xl", valueClassName)}>
				{value}
			</p>
		</div>
	)
}
