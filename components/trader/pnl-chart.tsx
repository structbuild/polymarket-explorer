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
import { Area, AreaChart, CartesianGrid, Line, ReferenceArea, ReferenceDot, XAxis, YAxis } from "recharts"

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

export type PnlChartOhlcMetric = "pnl" | "portfolio"
export type PnlChartMetric = PnlChartOhlcMetric | "usdBalance" | "openPositions"

const chartMetricOptions = [
	{ value: "pnl", label: "Profit/Loss" },
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

function getChartMetricValue(point: PnlDataPoint, metric: PnlChartMetric) {
	if (metric === "portfolio") return point.portfolioClose
	if (metric === "usdBalance") return point.usdBalance
	if (metric === "openPositions") return point.numOpenPositions
	return point.p
}

function isOhlcMetric(metric: PnlChartMetric): metric is PnlChartOhlcMetric {
	return metric === "pnl" || metric === "portfolio"
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
	metric,
	timezone,
}: {
	active?: boolean
	payload?: Array<{ payload?: PnlChartPoint }>
	showTime: boolean
	metric: PnlChartMetric
	timezone?: string
}) {
	const entry = payload?.[0]?.payload

	if (!active || !entry) {
		return null
	}

	const ohlc = isOhlcMetric(metric) ? getChartMetricOhlc(entry, metric) : null
	const change = ohlc ? ohlc.close - ohlc.open : 0

	return (
		<div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
			<div className="font-medium">
				{showTime ? formatDateTimeFull(entry.t, timezone) : formatDateFull(entry.t, timezone)}
			</div>
			<div className="grid gap-1.5">
				{ohlc ? (
					<>
						<TooltipValue label="Open" value={ohlc.open} />
						<TooltipValue label="High" value={ohlc.high} />
						<TooltipValue label="Low" value={ohlc.low} />
						<TooltipValue label="Close" value={ohlc.close} />
						<TooltipValue label="Change" value={change} valueClassName={pnlColorClass(change)} />
					</>
				) : (
					<TooltipValue
						label={metric === "openPositions" ? "Open positions" : "USD balance"}
						value={getChartMetricValue(entry, metric)}
						currency={metric !== "openPositions"}
					/>
				)}
				{metric === "portfolio" ? <TooltipValue label="PnL close" value={entry.close} /> : null}
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
	fillGapsActive?: boolean
	onFillGapsChange?: (next: boolean) => void
}) {
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
					{(highlightsAvailable && onHighlightsChange) || onFillGapsChange ? (
						<div className="grid gap-1.5 border-t pt-2">
							<div className="px-1 text-xs text-muted-foreground">Overlays</div>
							{highlightsAvailable && onHighlightsChange ? (
								<ToggleRow
									label="Best / worst period"
									active={highlightsActive}
									onChange={onHighlightsChange}
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
}: {
	label: string
	active: boolean
	onChange: (next: boolean) => void
}) {
	return (
		<button
			type="button"
			onClick={() => onChange(!active)}
			aria-pressed={active}
			className={cn(
				"flex items-center justify-between rounded-sm px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted",
				active ? "bg-muted text-foreground" : "text-muted-foreground",
			)}
		>
			<span>{label}</span>
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
	timeframe?: PnlTimeframe
	timezone?: string
	showTooltipTime?: boolean
	action?: ReactNode
	chartMode?: PnlChartMode
	chartMetric?: PnlChartMetric
}

export function PnlChartContent({ data, annotations = [], showAnnotations = false, timeframe, timezone, showTooltipTime, action, chartMode = "area", chartMetric = "pnl" }: PnlChartProps) {
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
							content={
								<PnlTooltipContent showTime={shouldShowTooltipTime} metric={chartMetric} timezone={timezone} />
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
			<p className="mb-1 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">{label}</p>
			<p className={cn("text-lg font-medium tabular-nums sm:text-2xl", valueClassName)}>
				{value}
			</p>
		</div>
	)
}
