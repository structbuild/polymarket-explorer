"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"
import type { PnlDataPoint } from "@/lib/polymarket/pnl"
import { formatNumber } from "@/lib/utils"

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

export function PnlChart({ data }: { data: PnlDataPoint[] }) {
	if (data.length === 0) {
		return (
			<div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground sm:h-[300px]">
				No PnL data available
			</div>
		)
	}

	const lastPnl = data[data.length - 1].p
	const isPositive = lastPnl >= 0

	return (
		<div className="overflow-hidden">
			<div className="mb-4">
				<p className="text-sm text-foreground mb-1">Cumulative PnL</p>
				<p className={`text-xl font-medium sm:text-2xl ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
					{formatNumber(lastPnl, { currency: true, compact: true })}
				</p>
			</div>
			<div className="relative">
				<ChartContainer config={chartConfig} className="h-[220px] min-h-[220px] w-full sm:h-[280px] sm:min-h-[250px]">
					<AreaChart accessibilityLayer data={data} margin={{ left: -20, right: 8, top: 8 }}>
						<defs>
							<linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="var(--color-pnl)" stopOpacity={0.3} />
								<stop offset="100%" stopColor="var(--color-pnl)" stopOpacity={0.02} />
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
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
							tickMargin={6}
							tickFormatter={(v) => formatNumber(v, { compact: true, currency: true })}
							tick={{ fontSize: 12 }}
							width={48}
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
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	)
}
