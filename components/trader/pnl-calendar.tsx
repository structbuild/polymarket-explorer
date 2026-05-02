"use client"

import type { DailyPnlEntry } from "@/lib/struct/pnl"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { getMonthGrid, intensityClass } from "@/lib/calendar-utils"
import { formatDateShort, pnlColorClass } from "@/lib/format"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function PnlCalendar({ data }: { data: DailyPnlEntry[] }) {
	const pnlByDate = useMemo(() => {
		const map = new Map<string, { pnl: number; label: string }>()
		for (const entry of data) {
			const date = new Date(entry.t * 1000)
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
			map.set(key, {
				pnl: (map.get(key)?.pnl ?? 0) + entry.pnl,
				label: formatDateShort(entry.t),
			})
		}
		return map
	}, [data])

	const latestDate = data.length > 0 ? new Date(data[data.length - 1].t * 1000) : new Date()
	const [viewYear, setViewYear] = useState(latestDate.getFullYear())
	const [viewMonth, setViewMonth] = useState(latestDate.getMonth())
	const [selectedKey, setSelectedKey] = useState<string | null>(null)
	const [isTouchDevice, setIsTouchDevice] = useState(false)

	const cells = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

	const { maxAbs, bestKey, worstKey } = useMemo(() => {
		let bestK: string | null = null
		let worstK: string | null = null
		let bestPnl = -Infinity
		let worstPnl = Infinity
		for (const [key, entry] of pnlByDate) {
			if (entry.pnl > bestPnl) { bestPnl = entry.pnl; bestK = key }
			if (entry.pnl < worstPnl) { worstPnl = entry.pnl; worstK = key }
		}
		let max = 0
		for (const [key, entry] of pnlByDate) {
			if (key === bestK || key === worstK) continue
			if (Math.abs(entry.pnl) > max) max = Math.abs(entry.pnl)
		}
		return { maxAbs: max, bestKey: bestPnl > 0 ? bestK : null, worstKey: worstPnl < 0 ? worstK : null }
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

	useEffect(() => {
		const mediaQuery = window.matchMedia("(hover: none) and (pointer: coarse)")
		const updateDeviceType = () => setIsTouchDevice(mediaQuery.matches)

		updateDeviceType()
		mediaQuery.addEventListener("change", updateDeviceType)

		return () => {
			mediaQuery.removeEventListener("change", updateDeviceType)
		}
	}, [])

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
					const cellClassName = cn(
						"group relative flex aspect-square flex-col items-center justify-center rounded-md text-[11px] transition-colors sm:text-xs",
						hasData
						? key === bestKey ? "bg-emerald-500 text-white"
						: key === worstKey ? "bg-red-500 text-white"
						: intensityClass(pnl, maxAbs)
						: "bg-muted/50",
						isTouchDevice && hasData && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
						isTouchDevice && activeSelectedKey === key && hasData && "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
					)

					const content = (
						<>
							<span className="text-base font-medium mb-0.5">{day}</span>
							{hasData && !isTouchDevice && (
								<>
									<span className={cn("leading-tight sm:text-sm", key === bestKey || key === worstKey ? "text-white" : "text-foreground/85")}>
										{formatNumber(pnl, { currency: true, compact: true })}
									</span>
									<div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground opacity-0 transition-opacity sm:group-hover:opacity-100">
										<span className={pnlColorClass(pnl)}>
											{formatNumber(pnl, { currency: true, compact: true })}
										</span>
										<span className="ml-1 text-muted-foreground">{entry?.label}</span>
									</div>
								</>
							)}
						</>
					)

					if (!isTouchDevice) {
						return (
							<div key={key} className={cellClassName}>
								{content}
							</div>
						)
					}

					return (
						<button
							type="button"
							key={key}
							onClick={() => hasData && setSelectedKey(key)}
							disabled={!hasData}
							aria-pressed={activeSelectedKey === key}
							className={cellClassName}
						>
							{content}
						</button>
					)
				})}
			</div>

			{isTouchDevice && selectedEntry && (
				<div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
					<span className="text-muted-foreground">{selectedEntry.label}</span>
					<span className={cn("font-medium", pnlColorClass(selectedEntry.pnl))}>
						{formatNumber(selectedEntry.pnl, { currency: true, compact: true })}
					</span>
				</div>
			)}
		</div>
	)
}
