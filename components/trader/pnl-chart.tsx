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
import { ChartArea, ChartCandlestick } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Line, ReferenceDot, XAxis, YAxis } from "recharts"

import {
	ChartContainer,
	ChartTooltip,
	type ChartConfig,
} from "@/components/ui/chart"
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
} satisfies ChartConfig

type PnlChartPoint = PnlDataPoint & {
	range: [number, number]
}

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

function toChartPoint(point: PnlDataPoint): PnlChartPoint {
	return {
		...point,
		range: [Math.min(point.open, point.close), Math.max(point.open, point.close)],
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
			</div>
		</div>
	)
}

function TooltipValue({ label, value, valueClassName }: { label: string; value: number; valueClassName?: string }) {
	return (
		<div className="flex items-center justify-between gap-4 leading-none">
			<span className="text-muted-foreground">{label}</span>
			<span className={cn("shrink-0 font-mono font-medium text-foreground tabular-nums", valueClassName)}>
				{formatNumber(value, { currency: true })}
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
}

export function PnlChartContent({ data, annotations = [], showAnnotations = false, timeframe, action, chartMode = "area" }: PnlChartProps) {
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
	const chartData = data.map(toChartPoint)
	const hasAnnotations = annotations.length > 0
	const visibleAnnotations = chartMode === "area" && showAnnotations ? annotations : []
	const shouldShowTooltipTime = timeframe !== undefined

	return (
		<div className="overflow-hidden">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between group-data-[share-mode=image]/share-card:mb-6 group-data-[share-mode=image]/share-card:items-end">
				<div>
					<p className="mb-1 text-sm text-foreground">Cumulative PnL</p>
					<p className={cn("text-xl font-medium sm:text-2xl", pnlColorClass(lastPnl))}>
						{formatNumber(lastPnl, { currency: true, compact: true })}
					</p>
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
						<div className="w-full sm:w-auto sm:shrink-0 group-data-[share-mode=image]/share-card:hidden" data-share-ignore="true">
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
							tickFormatter={(v) => formatNumber(v, { compact: true, currency: true })}
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
							dataKey="p"
							type="monotone"
							fill="url(#pnlGradient)"
							stroke="none"
							activeDot={false}
						/>
						<Area
							dataKey="range"
							type="monotone"
							fill="url(#pnlRangeGradient)"
							stroke="none"
							activeDot={false}
						/>
						<Line
							dataKey="p"
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
