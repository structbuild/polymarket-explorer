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
		const map = new Map<string, { pnl: number; label: string }>()
		for (const entry of data) {
			const date = new Date(entry.t * 1000)
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
			map.set(key, {
				pnl: (map.get(key)?.pnl ?? 0) + entry.pnl,
				label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
			})
		}
		return map
	}, [data])

	const latestDate = data.length > 0 ? new Date(data[data.length - 1].t * 1000) : new Date()
	const [viewYear, setViewYear] = useState(latestDate.getFullYear())
	const [viewMonth, setViewMonth] = useState(latestDate.getMonth())
	const [selectedKey, setSelectedKey] = useState<string | null>(null)

	const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

	const maxAbs = useMemo(() => {
		let max = 0
		for (const entry of pnlByDate.values()) {
			if (Math.abs(entry.pnl) > max) max = Math.abs(entry.pnl)
		}
		return max
	}, [pnlByDate])

	const monthKeys = useMemo(() => {
		return [...pnlByDate.keys()]
			.filter((key) => {
				const [year, month] = key.split("-").map(Number)
				return year === viewYear && month === viewMonth
			})
			.sort((a, b) => {
				const aDay = Number(a.split("-")[2])
				const bDay = Number(b.split("-")[2])
				return aDay - bDay
			})
	}, [pnlByDate, viewMonth, viewYear])

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
	const activeSelectedKey = selectedKey && monthKeys.includes(selectedKey) ? selectedKey : monthKeys.at(-1) ?? null
	const selectedEntry = activeSelectedKey ? pnlByDate.get(activeSelectedKey) : null

	return (
		<div>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-foreground">PnL Calendar</p>
				<div className="flex items-center justify-between gap-1 sm:justify-start">
					<Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(-1)}>
						<ChevronLeftIcon className="size-4" />
					</Button>
					<span className="min-w-[140px] text-center text-sm font-medium">{monthLabel}</span>
					<Button variant="ghost" size="icon" className="size-7" onClick={() => navigate(1)} disabled={isAtCurrentMonth}>
						<ChevronRightIcon className="size-4" />
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-7 gap-1 sm:gap-1.5">
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
					const entry = pnlByDate.get(key)
					const pnl = entry?.pnl
					const hasData = pnl !== undefined && pnl !== 0

					return (
						<button
							type="button"
							key={key}
							onClick={() => hasData && setSelectedKey(key)}
							disabled={!hasData}
							aria-pressed={activeSelectedKey === key}
							className={cn(
								"group relative flex aspect-square flex-col items-center justify-center rounded-md text-[11px] transition-colors sm:text-xs",
								hasData ? intensityClass(pnl, maxAbs) : "bg-muted/50",
								hasData && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
								activeSelectedKey === key && hasData && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
							)}
						>
							<span className="font-medium">{day}</span>
							{hasData && (
								<>
									<span className="mt-1 size-1 rounded-full bg-current/70 sm:hidden" />
									<div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 transition-opacity sm:group-hover:opacity-100">
										<span className={pnl >= 0 ? "text-emerald-500" : "text-red-500"}>
											{formatNumber(pnl, { currency: true, compact: true })}
										</span>
										<span className="ml-1 text-muted-foreground">{entry?.label}</span>
									</div>
								</>
							)}
						</button>
					)
				})}
			</div>

			{selectedEntry && (
				<div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
					<span className="text-muted-foreground">{selectedEntry.label}</span>
					<span className={selectedEntry.pnl >= 0 ? "font-medium text-emerald-500" : "font-medium text-red-500"}>
						{formatNumber(selectedEntry.pnl, { currency: true, compact: true })}
					</span>
				</div>
			)}
		</div>
	)
}
