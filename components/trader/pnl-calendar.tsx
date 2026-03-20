"use client"

import type { DailyPnlEntry } from "@/lib/polymarket/pnl"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/utils"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function getMonthGrid(year: number, month: number) {
	const firstDay = new Date(year, month, 1)
	const lastDay = new Date(year, month + 1, 0)
	const daysInMonth = lastDay.getDate()

	let startDow = firstDay.getDay() - 1
	if (startDow < 0) startDow = 6

	const cells: (number | null)[] = Array.from<null>({ length: startDow }).fill(null)
	for (let d = 1; d <= daysInMonth; d++) {
		cells.push(d)
	}
	while (cells.length % 7 !== 0) {
		cells.push(null)
	}

	return cells
}

function intensityClass(pnl: number, maxAbs: number) {
	if (maxAbs === 0) return "bg-muted"
	const ratio = Math.abs(pnl) / maxAbs

	if (pnl > 0) {
		if (ratio > 0.66) return "bg-emerald-500/70 text-white"
		if (ratio > 0.33) return "bg-emerald-500/40"
		return "bg-emerald-500/20"
	}
	if (ratio > 0.66) return "bg-red-500/70 text-white"
	if (ratio > 0.33) return "bg-red-500/40"
	return "bg-red-500/20"
}

export function PnlCalendar({ data }: { data: DailyPnlEntry[] }) {
	const pnlByDate = useMemo(() => {
		const map = new Map<string, number>()
		for (const entry of data) {
			const date = new Date(entry.t * 1000)
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
			map.set(key, (map.get(key) ?? 0) + entry.pnl)
		}
		return map
	}, [data])

	const latestDate = data.length > 0 ? new Date(data[data.length - 1].t * 1000) : new Date()
	const [viewYear, setViewYear] = useState(latestDate.getFullYear())
	const [viewMonth, setViewMonth] = useState(latestDate.getMonth())

	const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

	const maxAbs = useMemo(() => {
		let max = 0
		for (const v of pnlByDate.values()) {
			if (Math.abs(v) > max) max = Math.abs(v)
		}
		return max
	}, [pnlByDate])

	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth()
	const isAtCurrentMonth = viewYear === currentYear && viewMonth === currentMonth

	function navigate(delta: number) {
		let m = viewMonth + delta
		let y = viewYear
		if (m < 0) { m = 11; y-- }
		if (m > 11) { m = 0; y++ }
		if (y > currentYear || (y === currentYear && m > currentMonth)) return
		setViewMonth(m)
		setViewYear(y)
	}

	const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })

	return (
		<div>
			<div className="flex items-center justify-between mb-4">
				<p className="text-sm text-foreground">PnL Calendar</p>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(-1)}>
						<ChevronLeftIcon className="size-4" />
					</Button>
					<span className="text-sm font-medium min-w-[140px] text-center">{monthLabel}</span>
					<Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(1)} disabled={isAtCurrentMonth}>
						<ChevronRightIcon className="size-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-7 gap-1">
				{WEEKDAYS.map((day) => (
					<div key={day} className="text-center text-xs text-muted-foreground pb-1">
						{day}
					</div>
				))}
				{cells.map((day, i) => {
					if (day === null) {
						return <div key={`empty-${i}`} className="aspect-square" />
					}

					const key = `${viewYear}-${viewMonth}-${day}`
					const pnl = pnlByDate.get(key)
					const hasData = pnl !== undefined && pnl !== 0

					return (
						<div
							key={key}
							className={cn(
								"aspect-square rounded-md flex flex-col items-center justify-center text-xs relative group",
								hasData ? intensityClass(pnl, maxAbs) : "bg-muted/50"
							)}
						>
							<span className="font-medium">{day}</span>
							{hasData && (
								<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-popover border text-popover-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
									<span className={pnl >= 0 ? "text-emerald-500" : "text-red-500"}>
										{formatNumber(pnl, { currency: true, compact: true })}
									</span>
									<span className="text-muted-foreground ml-1">
										{new Date(viewYear, viewMonth, day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
									</span>
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
