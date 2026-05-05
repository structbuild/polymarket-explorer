"use client"

import { useEffect, useRef, type ReactNode } from "react"
import {
	CandlestickSeries,
	ColorType,
	createChart,
	type CandlestickData,
	type IChartApi,
	type UTCTimestamp,
} from "lightweight-charts"
import { ChartArea, ChartCandlestick, Settings2Icon } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Line, ReferenceDot, XAxis, YAxis } from "recharts"

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { PnlChartAnnotation, PnlDataPoint } from "@/lib/struct/pnl"
import { formatDateCompact, formatDateFull, formatDateTimeFull, pnlColorClass } from "@/lib/format"
import { formatNumber } from "@/lib/format"
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

export type PnlChartMetric = "pnl" | "usdBalance" | "openPositions"

const chartMetricOptions = [
	{ value: "pnl", label: "PnL" },
	{ value: "usdBalance", label: "USD Balance" },
	{ value: "openPositions", label: "Open Positions" },
] satisfies Array<{ value: PnlChartMetric; label: string }>

const annotationConfig = {
	best: {
		label: "Best day",
		color: "#10b981",
		bgRgba: "rgba(16, 185, 129, 0.20)",
		badgeVariant: "positive",
		badgeClassName: "border-emerald-500/20 bg-emerald-500/10",
		valueClassName: "text-emerald-600 dark:text-emerald-400",
		labelPosition: "top",
	},
	worst: {
		label: "Worst day",
		color: "#ef4444",
		bgRgba: "rgba(239, 68, 68, 0.20)",
		badgeVariant: "negative",
		badgeClassName: "border-red-500/20 bg-red-500/10",
		valueClassName: "text-red-600 dark:text-red-400",
		labelPosition: "bottom",
	},
} satisfies Record<
	PnlChartAnnotation["kind"],
	{
		label: string
		color: string
		bgRgba: string
		badgeVariant: "positive" | "negative"
		badgeClassName: string
		valueClassName: string
		labelPosition: "top" | "bottom"
	}
>

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

function getChartMetricValue(point: PnlDataPoint, metric: PnlChartMetric) {
	if (metric === "usdBalance") return point.usdBalance
	if (metric === "openPositions") return point.numOpenPositions
	return point.p
}

function formatChartMetricValue(value: number, metric: PnlChartMetric) {
	if (metric === "openPositions") return formatNumber(value, { decimals: 0 })
	return formatNumber(value, { currency: true, compact: true })
}

function toChartPoint(point: PnlDataPoint, metric: PnlChartMetric): PnlChartPoint {
	return {
		...point,
		range: [Math.min(point.open, point.close), Math.max(point.open, point.close)],
		metric: getChartMetricValue(point, metric),
	}
}

function PnlTooltipContent({
	active,
	payload,
	showTime,
}: {
	active?: boolean
	payload?: Array<{ payload?: PnlChartPoint }>
	showTime: boolean
}) {
	const entry = payload?.[0]?.payload

	if (!active || !entry) {
		return null
	}

	const change = entry.close - entry.open

	return (
		<div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
			<div className="font-medium">
				{showTime ? formatDateTimeFull(entry.t) : formatDateFull(entry.t)}
			</div>
			<div className="grid gap-1.5">
				<TooltipValue label="Open" value={entry.open} />
				<TooltipValue label="High" value={entry.high} />
				<TooltipValue label="Low" value={entry.low} />
				<TooltipValue label="Close" value={entry.close} />
				<TooltipValue label="Change" value={change} valueClassName={pnlColorClass(change)} />
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
}: {
	chartMode: PnlChartMode
	onChartModeChange: (value: PnlChartMode) => void
	chartMetric: PnlChartMetric
	onChartMetricChange: (value: PnlChartMetric) => void
}) {
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
						<ChartModeToggle value={chartMode} onChange={onChartModeChange} />
					</div>
					<div className="grid gap-1">
						<div className="px-1 text-xs text-muted-foreground">Metric</div>
						{chartMetricOptions.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => onChartMetricChange(option.value)}
								disabled={chartMode !== "area"}
								className={cn(
									"rounded-sm px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
									chartMetric === option.value ? "bg-muted text-foreground" : "text-muted-foreground"
								)}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}

function toCandlestickData(data: PnlDataPoint[]): CandlestickData<UTCTimestamp>[] {
	return data.map((point) => ({
		time: point.t as UTCTimestamp,
		open: point.open,
		high: point.high,
		low: point.low,
		close: point.close,
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

function PnlCandlestickChart({ data }: { data: PnlDataPoint[] }) {
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

		series.setData(toCandlestickData(data))
		chart.timeScale().fitContent()

		return () => {
			chart.remove()
		}
	}, [data])

	return <div ref={containerRef} className="h-[260px] min-h-[260px] w-full sm:h-[340px] sm:min-h-[310px]" />
}

export function PnlChart({
	data,
	annotations,
	showAnnotations,
	timeframe,
}: {
	data: PnlDataPoint[]
	annotations?: PnlChartAnnotation[]
	showAnnotations?: boolean
	timeframe?: PnlTimeframe
}) {
	return <PnlChartContent data={data} annotations={annotations} showAnnotations={showAnnotations} timeframe={timeframe} />
}

type PnlChartProps = {
	data: PnlDataPoint[]
	annotations?: PnlChartAnnotation[]
	showAnnotations?: boolean
	timeframe?: PnlTimeframe
	action?: ReactNode
	chartMode?: PnlChartMode
	chartMetric?: PnlChartMetric
}

export function PnlChartContent({ data, annotations = [], showAnnotations = false, timeframe, action, chartMode = "area", chartMetric = "pnl" }: PnlChartProps) {
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
				<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground sm:h-[340px]">
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
	const shouldShowTooltipTime = timeframe !== undefined
	const showPnlRange = chartMetric === "pnl"

	return (
		<div className="overflow-hidden">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between group-data-[share-mode=image]/share-card:mb-6 group-data-[share-mode=image]/share-card:items-end">
				<div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:gap-5">
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
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
					{hasAnnotations ? (
						<div
							aria-hidden={!showAnnotations}
							className={cn(
								"hidden flex-wrap gap-2 group-data-[share-mode=image]/share-card:flex",
								showAnnotations ? "opacity-100" : "opacity-0 pointer-events-none"
							)}
						>
							{annotations.map((annotation) => {
								const tone = annotationConfig[annotation.kind]

								return (
									<div
										key={`${annotation.kind}-${annotation.t}`}
										className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs backdrop-blur-md", tone.badgeClassName)}
									>
										<span className={cn("font-medium", tone.valueClassName)}>{tone.label}</span>
										<span className="text-foreground/80">{annotation.date}</span>
										<span className={cn("font-medium", tone.valueClassName)}>
											{formatNumber(annotation.dailyPnl, { currency: true, compact: true })}
										</span>
									</div>
								)
							})}
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
							{annotations.map((annotation) => {
								const tone = annotationConfig[annotation.kind]

								return (
									<div
										key={`${annotation.kind}-${annotation.t}`}
										className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs backdrop-blur-md", tone.badgeClassName)}
									>
										<span className={cn("font-medium", tone.valueClassName)}>{tone.label}</span>
										<span className="text-foreground/80">{annotation.date}</span>
										<span className={cn("font-medium", tone.valueClassName)}>
											{formatNumber(annotation.dailyPnl, { currency: true, compact: true })}
										</span>
									</div>
								)
							})}
						</div>
					</div>
				</div>
			) : null}
			<div className="relative">
				{chartMode === "candles" ? (
					<PnlCandlestickChart data={data} />
				) : (
					<ChartContainer config={chartConfig} className="h-[260px] min-h-[260px] w-full sm:h-[340px] sm:min-h-[310px]">
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
							tickFormatter={formatDateCompact}
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
							content={
								<PnlTooltipContent showTime={shouldShowTooltipTime} />
							}
						/>
						<Area
							dataKey="metric"
							type="monotone"
							fill="url(#pnlGradient)"
							stroke="none"
							activeDot={false}
						/>
						{showPnlRange ? (
							<Area
								dataKey="range"
								type="monotone"
								fill="url(#pnlRangeGradient)"
								stroke="none"
								activeDot={false}
							/>
						) : null}
						<Line
							dataKey="metric"
							type="monotone"
							dot={false}
							stroke="var(--color-pnl)"
							strokeWidth={2}
						/>
						{visibleAnnotations.map((annotation) => {
							const tone = annotationConfig[annotation.kind]

							return (
								<ReferenceDot
									key={`${annotation.kind}-${annotation.t}`}
									x={annotation.t}
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
						</AreaChart>
					</ChartContainer>
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
			<p className="mb-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
			<p className={cn("text-lg font-medium tabular-nums sm:text-2xl", valueClassName)}>
				{value}
			</p>
		</div>
	)
}
