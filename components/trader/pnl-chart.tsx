"use client"

import type { HTMLAttributes, ReactNode } from "react"
import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from "recharts"

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import type { PnlChartAnnotation, PnlDataPoint } from "@/lib/polymarket/pnl"
import { cn, formatNumber } from "@/lib/utils"

const chartConfig = {
	pnl: {
		label: "PnL",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig

function formatDate(ts: number) {
	return new Date(ts * 1000).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	})
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

const ANNOTATION_LABEL_WIDTH = 68
const ANNOTATION_LABEL_HEIGHT = 20
const ANNOTATION_LABEL_GAP = 8
type AnnotationDotShapeProps = {
	annotationKind: PnlChartAnnotation["kind"]
	cx?: number
	cy?: number
	r?: number
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
	const labelY = tone.labelPosition === "top"
		? cy - r - ANNOTATION_LABEL_HEIGHT - ANNOTATION_LABEL_GAP
		: cy + r + ANNOTATION_LABEL_GAP

	const pillR = ANNOTATION_LABEL_HEIGHT / 2

	return (
		<g>
			<circle cx={cx} cy={cy} r={r} fill={fill ?? tone.color} stroke={stroke} strokeWidth={strokeWidth} />
			<g
				className="chart-annotation-label-svg"
				transform={`translate(${cx - ANNOTATION_LABEL_WIDTH / 2} ${labelY})`}
			>
				<rect
					width={ANNOTATION_LABEL_WIDTH}
					height={ANNOTATION_LABEL_HEIGHT}
					rx={pillR}
					ry={pillR}
					fill={tone.bgRgba}
					stroke={tone.bgRgba}
					strokeWidth={1}
				/>
				<text
					x={ANNOTATION_LABEL_WIDTH / 2}
					y={ANNOTATION_LABEL_HEIGHT / 2}
					textAnchor="middle"
					dominantBaseline="central"
					fill={tone.color}
					fontSize={12}
					fontWeight={500}
					fontFamily="system-ui, -apple-system, sans-serif"
				>
					{tone.label}
				</text>
			</g>
			<foreignObject
				className="chart-annotation-label-html"
				x={cx - ANNOTATION_LABEL_WIDTH / 2}
				y={labelY}
				width={ANNOTATION_LABEL_WIDTH}
				height={ANNOTATION_LABEL_HEIGHT}
			>
					<div
						className="pointer-events-none flex h-full w-full items-center justify-center"
						{...({ xmlns: "http://www.w3.org/1999/xhtml" } as HTMLAttributes<HTMLDivElement>)}
					>
						<Badge
							variant={tone.badgeVariant}
							className="border border-background/80 shadow-sm backdrop-blur-md"
						>
							{tone.label}
						</Badge>
					</div>
			</foreignObject>
		</g>
	)
}

export function PnlChart({
	data,
	annotations,
	showAnnotations,
}: {
	data: PnlDataPoint[]
	annotations?: PnlChartAnnotation[]
	showAnnotations?: boolean
}) {
	return <PnlChartContent data={data} annotations={annotations} showAnnotations={showAnnotations} />
}

type PnlChartProps = {
	data: PnlDataPoint[]
	annotations?: PnlChartAnnotation[]
	showAnnotations?: boolean
	action?: ReactNode
}

export function PnlChartContent({ data, annotations = [], showAnnotations = false, action }: PnlChartProps) {
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
				<div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground sm:h-[280px]">
					No PnL data available
				</div>
			</div>
		)
	}

	const lastPnl = data[data.length - 1].p
	const isPositive = lastPnl >= 0
	const hasAnnotations = annotations.length > 0
	const visibleAnnotations = showAnnotations ? annotations : []

	return (
		<div className="overflow-hidden">
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p className="mb-1 text-sm text-foreground">Cumulative PnL</p>
					<p className={`text-xl font-medium sm:text-2xl ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
						{formatNumber(lastPnl, { currency: true, compact: true })}
					</p>
				</div>
				{action ? (
					<div className="w-full sm:w-auto sm:shrink-0" data-share-ignore="true">
						{action}
					</div>
				) : null}
			</div>
			{hasAnnotations ? (
				<div
					aria-hidden={!showAnnotations}
					className={cn(
						"grid overflow-hidden transition-[grid-template-rows,margin,opacity] duration-200 ease-out motion-reduce:transition-none",
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
										className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs", tone.badgeClassName)}
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
				<ChartContainer config={chartConfig} className="h-[220px] min-h-[220px] w-full sm:h-[280px] sm:min-h-[250px]">
					<AreaChart accessibilityLayer data={data} margin={{ left: -20, right: 60, top: 36, bottom: 36 }}>
						<defs>
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
							tickFormatter={formatDate}
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
								<ChartTooltipContent
									labelFormatter={(_, payload) => {
										const entry = payload[0]?.payload as PnlDataPoint | undefined
										if (!entry) return ""
										return new Date(entry.t * 1000).toLocaleDateString("en-US", {
											month: "long",
											day: "numeric",
											year: "numeric",
										})
									}}
									formatter={(value) => formatNumber(value as number, { currency: true })}
								/>
							}
						/>
						<Area
							dataKey="p"
							type="monotone"
							fill="url(#pnlGradient)"
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
									isFront
									ifOverflow="visible"
									shape={(props) => <AnnotationDotShape {...props} annotationKind={annotation.kind} />}
								/>
							)
						})}
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	)
}
