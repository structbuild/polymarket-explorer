"use client"

import type { DailyPnlEntry, PnlPeriodRecord, PnlPeriods } from "@/lib/struct/pnl"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import { getMonthGrid, intensityClass } from "@/lib/calendar-utils"
import { formatDateShort, pnlColorClass } from "@/lib/format"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function periodDateKey(period: PnlPeriodRecord | null): string | null {
	if (!period) return null

	const date = new Date(period.from * 1000)
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function PnlCalendar({ data, periods }: { data: DailyPnlEntry[]; periods: PnlPeriods }) {
	const pnlByDate = useMemo(() => {
		const map = new Map<string, DailyPnlEntry & { label: string }>()
		for (const entry of data) {
			const date = new Date(entry.t * 1000)
			const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
			map.set(key, {
				...entry,
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
		const bestK = periodDateKey(periods.totalPnl.day.best)
		const worstK = periodDateKey(periods.totalPnl.day.worst)
		let max = 0
		let fallbackMax = 0
		for (const [key, entry] of pnlByDate) {
			const absPnl = Math.abs(entry.pnl)
			if (absPnl > fallbackMax) fallbackMax = absPnl
			if (key === bestK || key === worstK) continue
			if (absPnl > max) max = absPnl
		}
		return {
			maxAbs: max || fallbackMax,
			bestKey: (periods.totalPnl.day.best?.change ?? 0) > 0 ? bestK : null,
			worstKey: (periods.totalPnl.day.worst?.change ?? 0) < 0 ? worstK : null,
		}
	}, [pnlByDate, periods])

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
		posthog.capture("trader_pnl_calendar_navigated", {
			direction: delta < 0 ? "previous" : "next",
			month: m,
			year: y,
		})
		setViewMonth(m)
		setViewYear(y)
	}

	const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })
	const activeSelectedKey = selectedKey && monthKeys.includes(selectedKey) ? selectedKey : monthKeys.at(-1) ?? null
	const selectedEntry = activeSelectedKey ? pnlByDate.get(activeSelectedKey) : null

	function CalendarTooltip({ entry }: { entry: DailyPnlEntry & { label: string } }) {
		return (
			<div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-lg border border-border/70 bg-popover p-2 text-xs text-popover-foreground opacity-0 shadow-lg transition-opacity sm:group-hover:opacity-100">
				<div className="mb-2 flex items-start justify-between gap-3 border-b border-border/60 pb-2">
					<div>
						<p className="font-medium leading-none">{entry.label}</p>
						<p className="mt-1 text-[11px] text-muted-foreground">Daily PnL</p>
					</div>
					<span className={cn("font-mono font-semibold tabular-nums", pnlColorClass(entry.pnl))}>
						{formatNumber(entry.pnl, { currency: true, compact: true })}
					</span>
				</div>
				<div className="grid gap-1">
					<CalendarTooltipRow label="Open" value={entry.open} />
					<CalendarTooltipRow label="High" value={entry.high} />
					<CalendarTooltipRow label="Low" value={entry.low} />
					<CalendarTooltipRow label="Close" value={entry.close} />
					<CalendarTooltipRow label="Open positions" value={entry.numOpenPositions} currency={false} />
					<CalendarTooltipRow label="USD balance" value={entry.usdBalance} />
				</div>
			</div>
		)
	}

	function CalendarTooltipRow({ label, value, currency = true }: { label: string; value: number; currency?: boolean }) {
		return (
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-mono font-medium tabular-nums">{formatNumber(value, currency ? { currency: true, compact: true } : { decimals: 0 })}</span>
			</div>
		)
	}

	return (
		<div>
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-base font-medium text-foreground">PnL Calendar</p>
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
									{entry ? <CalendarTooltip entry={entry} /> : null}
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
							onClick={() => {
								if (!hasData) return
								posthog.capture("trader_pnl_calendar_day_selected", { date: key })
								setSelectedKey(key)
							}}
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
				<div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
					<div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
						<div>
							<p className="font-medium leading-none">{selectedEntry.label}</p>
							<p className="mt-1.5 text-xs text-muted-foreground">Daily PnL</p>
						</div>
						<span className={cn("font-mono text-base font-medium tabular-nums", pnlColorClass(selectedEntry.pnl))}>
							{formatNumber(selectedEntry.pnl, { currency: true, compact: true })}
						</span>
					</div>
					<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
						<CalendarSelectedMetric label="Open" value={selectedEntry.open} />
						<CalendarSelectedMetric label="High" value={selectedEntry.high} />
						<CalendarSelectedMetric label="Low" value={selectedEntry.low} />
						<CalendarSelectedMetric label="Close" value={selectedEntry.close} />
						<CalendarSelectedMetric label="USD Balance" value={selectedEntry.usdBalance} />
						<CalendarSelectedMetric label="Open Positions" value={selectedEntry.numOpenPositions} currency={false} />
					</div>
				</div>
			)}
		</div>
	)
}

function CalendarSelectedMetric({
	label,
	value,
	currency = true,
	valueClassName,
}: {
	label: string
	value: number | null
	currency?: boolean
	valueClassName?: string
}) {
	return (
		<div className="rounded-md bg-muted px-3 py-2">
			<p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
			<p className={cn("mt-1 font-mono text-sm font-medium tabular-nums", valueClassName)}>
				{formatNumber(value, currency ? { currency: true, compact: true } : { decimals: 0 })}
			</p>
		</div>
	)
}
