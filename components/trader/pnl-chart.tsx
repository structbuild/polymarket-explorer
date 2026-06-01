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
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceDot, useXAxisScale, useYAxisScale, XAxis, YAxis } from "recharts"

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
	{ value: "pnl", label: "PnL" },
	{ value: "realized", label: "Realized PnL" },
	{ value: "unrealized", label: "Unrealized PnL" },
	{ value: "portfolio", label: "Portfolio Value" },
	{ value: "usdBalance", label: "USD Balance" },
	{ value: "openPositions", label: "Open Positions" },
] satisfies Array<{ value: PnlChartMetric; label: string }>

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

function ExitBubblePopoverContent({ exit, timezone }: { exit: PnlChartExit; timezone?: string }) {
	const isWin = exit.pnlUsd >= 0
	const href = exit.marketSlug ? `https://polymarket.com/market/${exit.marketSlug}` : null
	const image = exit.imageUrl ? normalizePolymarketS3ImageUrl(exit.imageUrl) : null

	return (
		<div className="grid gap-2.5">
			<div className="flex items-start gap-2.5">
				{image ? (
					<img className="size-10 shrink-0 rounded-md object-cover" alt="" src={image} />
				) : (
					<div className="size-10 shrink-0 rounded-md bg-muted" />
				)}
				<p className="min-w-0 flex-1 text-sm font-medium leading-snug">{exit.question}</p>
			</div>
			<div className="flex flex-wrap items-center gap-1.5">
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
			</div>
			<div className="grid gap-1.5 border-t pt-2 text-xs">
				<ExitPopoverRow label="Realized PnL" valueClassName={pnlColorClass(exit.pnlUsd)}>
					{formatNumber(exit.pnlUsd, { currency: true, compact: true })}
					{exit.pnlPct != null ? (
						<span className="text-muted-foreground"> ({formatNumber(exit.pnlPct, { percent: true })})</span>
					) : null}
				</ExitPopoverRow>
				<ExitPopoverRow label="Invested">
					{formatNumber(exit.costBasisUsd, { currency: true, compact: true })}
				</ExitPopoverRow>
				<ExitPopoverRow label="Closed">{formatDateFull(exit.t, timezone)}</ExitPopoverRow>
			</div>
			{href ? (
				<a
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					className={cn(
						"text-xs font-medium underline-offset-4 hover:underline",
						isWin ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
					)}
				>
					View on Polymarket
				</a>
			) : null}
		</div>
	)
}

function ExitPopoverRow({
	label,
	valueClassName,
	children,
}: {
	label: string
	valueClassName?: string
	children: ReactNode
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-muted-foreground">{label}</span>
			<span className={cn("font-medium tabular-nums text-foreground", valueClassName)}>{children}</span>
		</div>
	)
}

const EXIT_BUBBLE_HIT_SIZE = 48
const EXIT_STACK_PITCH = 26
const EXIT_CLUSTER_THRESHOLD = EXIT_BUBBLE_SIZE
const EXIT_STACK_MAX_VISIBLE = 5

type ExitPosition = {
	exit: PnlChartExit
	cx: number
	cy: number
}

type StackedBubble =
	| { type: "exit"; exit: PnlChartExit; cx: number; cy: number }
	| { type: "overflow"; count: number; tone: "win" | "loss" | "mixed"; cx: number; cy: number }

function stackExitPositions(positions: ExitPosition[]): StackedBubble[] {
	if (positions.length === 0) return []

	const sorted = [...positions].sort((a, b) => a.cx - b.cx)
	const stacked: StackedBubble[] = []

	let cluster: ExitPosition[] = []
	let anchorCx = sorted[0].cx

	const flush = () => {
		if (cluster.length === 0) return

		const avgCx = cluster.reduce((sum, pos) => sum + pos.cx, 0) / cluster.length
		const avgCy = cluster.reduce((sum, pos) => sum + pos.cy, 0) / cluster.length

		const byMagnitude = [...cluster].sort((a, b) => Math.abs(b.exit.pnlUsd) - Math.abs(a.exit.pnlUsd))
		const kept = byMagnitude.slice(0, EXIT_STACK_MAX_VISIBLE).sort((a, b) => b.exit.pnlUsd - a.exit.pnlUsd)
		const overflowCount = cluster.length - kept.length

		const wins = cluster.filter((pos) => pos.exit.pnlUsd >= 0).length
		const tone: "win" | "loss" | "mixed" = wins === cluster.length ? "win" : wins === 0 ? "loss" : "mixed"

		const rows = kept.length + (overflowCount > 0 ? 1 : 0)
		const offset = (rows - 1) / 2

		kept.forEach((pos, index) => {
			stacked.push({ type: "exit", exit: pos.exit, cx: avgCx, cy: avgCy + (index - offset) * EXIT_STACK_PITCH })
		})

		if (overflowCount > 0) {
			stacked.push({ type: "overflow", count: overflowCount, tone, cx: avgCx, cy: avgCy + (kept.length - offset) * EXIT_STACK_PITCH })
		}

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

	return stacked
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

function ExitBubble({ exit, timezone, style }: { exit: PnlChartExit; timezone?: string; style?: CSSProperties }) {
	const isWin = exit.pnlUsd >= 0
	const image = exit.imageUrl ? normalizePolymarketS3ImageUrl(exit.imageUrl) : null

	return (
		<div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={style}>
			<Popover>
				<PopoverTrigger
					openOnHover
					delay={250}
					closeDelay={120}
					render={
						<button
							type="button"
							aria-label={`${isWin ? "Winning" : "Losing"} exit: ${exit.question}`}
							className="group pointer-events-auto flex items-center justify-center outline-none"
							style={{ width: EXIT_BUBBLE_HIT_SIZE, height: EXIT_BUBBLE_HIT_SIZE }}
						>
							<span
								className={cn(
									"block overflow-hidden rounded-full border-2 bg-card shadow-md transition-transform group-hover:scale-110 group-focus-visible:scale-110",
									isWin ? "border-emerald-500" : "border-red-500",
								)}
								style={{ width: EXIT_BUBBLE_SIZE, height: EXIT_BUBBLE_SIZE }}
							>
								{image ? (
									<img src={image} alt="" className="size-full object-cover" />
								) : (
									<span className={cn("block size-full", isWin ? "bg-emerald-500/20" : "bg-red-500/20")} />
								)}
							</span>
						</button>
					}
				/>
				<PopoverContent align="center" side="top" className="w-64">
					<ExitBubblePopoverContent exit={exit} timezone={timezone} />
				</PopoverContent>
			</Popover>
		</div>
	)
}

function ExitOverflowBubble({ count, tone, style }: { count: number; tone: "win" | "loss" | "mixed"; style?: CSSProperties }) {
	return (
		<div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={style}>
			<div className="flex items-center justify-center" style={{ width: EXIT_BUBBLE_HIT_SIZE, height: EXIT_BUBBLE_HIT_SIZE }}>
				<span
					className={cn(
						"flex items-center justify-center rounded-full border-2 bg-card text-[11px] font-semibold tabular-nums shadow-md",
						tone === "win"
							? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
							: tone === "loss"
								? "border-red-500 text-red-600 dark:text-red-400"
								: "border-border text-muted-foreground",
					)}
					style={{ width: EXIT_BUBBLE_SIZE, height: EXIT_BUBBLE_SIZE }}
				>
					+{count}
				</span>
			</div>
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

function isOhlcMetric(metric: PnlChartMetric): metric is PnlChartOhlcMetric {
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

function PnlTooltipContent({
	active,
	payload,
	showTime,
	timezone,
}: {
	active?: boolean
	payload?: Array<{ payload?: PnlChartPoint }>
	showTime: boolean
	timezone?: string
}) {
	const entry = payload?.[0]?.payload

	if (!active || !entry) {
		return null
	}

	const change = entry.close - entry.open

	return (
		<div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
			<div className="font-medium">
				{showTime ? formatDateTimeFull(entry.t, timezone) : formatDateFull(entry.t, timezone)}
			</div>
			<div className="grid gap-1.5">
				<TooltipValue label="Open" value={entry.open} />
				<TooltipValue label="High" value={entry.high} />
				<TooltipValue label="Low" value={entry.low} />
				<TooltipValue label="Close" value={entry.close} />
				<TooltipValue label="Change" value={change} valueClassName={pnlColorClass(change)} />
				<TooltipValue label="Realized PnL" value={entry.realizedClose} valueClassName={pnlColorClass(entry.realizedClose)} />
				<TooltipValue label="Unrealized PnL" value={entry.unrealizedClose} valueClassName={pnlColorClass(entry.unrealizedClose)} />
				<TooltipValue label="Portfolio value" value={entry.portfolioClose} />
				<TooltipValue label="USD balance" value={entry.usdBalance} />
				<TooltipValue label="Open positions" value={entry.numOpenPositions} currency={false} />
			</div>
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

export function ChartSettingsButton({
	chartMode,
	onChartModeChange,
	chartMetric,
	onChartMetricChange,
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
}: {
	chartMode: PnlChartMode
	onChartModeChange: (value: PnlChartMode) => void
	chartMetric: PnlChartMetric
	onChartMetricChange: (value: PnlChartMetric) => void
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
}) {
	const exitsDisabled = chartMode !== "area" || chartMetric !== "pnl"
	function handleChartModeChange(nextMode: PnlChartMode) {
		onChartModeChange(nextMode)
		if (nextMode === "candles" && !isOhlcMetric(chartMetric)) {
			onChartMetricChange("pnl")
		}
	}

	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button variant="outline" size="icon-sm" className="rounded-full" aria-label="Chart settings" title="Chart settings">
						<Settings2Icon aria-hidden="true" className="size-4" />
					</Button>
				}
			/>
			<PopoverContent align="end" className="w-52 p-2">
				<div className="grid gap-3">
					<div className="grid gap-1.5">
						<div className="px-1 text-xs text-muted-foreground">Chart type</div>
						<ChartModeToggle value={chartMode} onChange={handleChartModeChange} />
					</div>
					<div className="grid gap-1">
						<div className="px-1 text-xs text-muted-foreground">Metric</div>
						{chartMetricOptions.map((option) => {
							const isDisabled = chartMode === "candles" && !isOhlcMetric(option.value)

							return (
								<button
									key={option.value}
									type="button"
									onClick={() => onChartMetricChange(option.value)}
									disabled={isDisabled}
									className={cn(
										"rounded-sm px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
										chartMetric === option.value ? "bg-muted text-foreground" : "text-muted-foreground"
									)}
								>
									{option.label}
								</button>
							)
						})}
					</div>
					{(highlightsAvailable && onHighlightsChange) ||
					(winExitsAvailable && onWinExitsChange) ||
					(lossExitsAvailable && onLossExitsChange) ||
					onFillGapsChange ? (
						<div className="grid gap-1.5 border-t pt-2">
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
	chartMode?: PnlChartMode
	chartMetric?: PnlChartMetric
}

export function PnlChartContent({ data, annotations = [], showAnnotations = false, exits = [], showWinExits = false, showLossExits = false, timeframe, timezone, showTooltipTime, action, chartMode = "area", chartMetric = "pnl" }: PnlChartProps) {
	const [exitPositions, setExitPositions] = useState<ExitPosition[]>([])

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
		? exits.filter((exit) => (exit.pnlUsd >= 0 ? showWinExits : showLossExits))
		: []
	const exitDots = snapExitsToChart(visibleExits, chartData)
	const shouldShowTooltipTime = showTooltipTime ?? timeframe !== undefined
	const showMetricRange = isOhlcMetric(chartMetric)
	const candlestickMetric = isOhlcMetric(chartMetric) ? chartMetric : "pnl"

	return (
		<div className="overflow-hidden">
			<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between group-data-[share-mode=image]/share-card:mb-6 group-data-[share-mode=image]/share-card:items-end">
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
			<div className="relative">
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
								<PnlTooltipContent showTime={shouldShowTooltipTime} timezone={timezone} />
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
							{stackExitPositions(exitPositions).map((pos, index) =>
								pos.type === "exit" ? (
									<ExitBubble
										key={`exit-${pos.exit.t}-${pos.exit.marketSlug ?? pos.exit.question}`}
										exit={pos.exit}
										timezone={timezone}
										style={{ left: pos.cx, top: pos.cy }}
									/>
								) : (
									<ExitOverflowBubble
										key={`exit-overflow-${index}-${Math.round(pos.cx)}`}
										count={pos.count}
										tone={pos.tone}
										style={{ left: pos.cx, top: pos.cy }}
									/>
								),
							)}
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
