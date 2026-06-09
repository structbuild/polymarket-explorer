"use client"

import { useMemo, useState, useTransition, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useQueryStates } from "nuqs"
import posthog from "posthog-js"
import { CalendarIcon, ChevronDownIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { TimezoneSelect } from "@/components/ui/timezone-select"
import {
	pnlAnchorParser,
	pnlFromParser,
	pnlTimeframeParser,
	pnlToParser,
} from "@/lib/trader-search-params"
import {
	pnlAnchorValues,
	type PnlAnchor,
	type PnlTimeframe,
} from "@/lib/struct/pnl-timeframes"
import { ANCHOR_LABELS, pnlRangeChipLabel } from "@/lib/pnl-range-label"
import { useTimezone } from "@/lib/hooks/use-timezone"
import { cn } from "@/lib/utils"

const RANGE_PARAMS = {
	pnlTimeframe: pnlTimeframeParser,
	pnlAnchor: pnlAnchorParser,
	pnlFrom: pnlFromParser,
	pnlTo: pnlToParser,
}

type PnlRangeDialogProps = {
	mode: "preset" | "anchor" | "custom"
	timeframe: PnlTimeframe
	anchor: PnlAnchor | null
	from: number | undefined
	to: number | undefined
	timezone: string
	firstTradeAt?: number
}

function startOfDayUtcSeconds(date: Date): number {
	const copy = new Date(date)
	copy.setUTCHours(0, 0, 0, 0)
	return Math.floor(copy.getTime() / 1000)
}

function endOfDayUtcSeconds(date: Date): number {
	const copy = new Date(date)
	copy.setUTCHours(23, 59, 59, 0)
	return Math.floor(copy.getTime() / 1000)
}

function unixSecondsToDate(seconds: number | undefined): Date | undefined {
	if (seconds === undefined) return undefined
	const date = new Date(seconds * 1000)
	return Number.isNaN(date.getTime()) ? undefined : date
}

function formatDraftDate(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function PnlRangeDialog({ mode, timeframe, anchor, from, to, timezone: serverTimezone, firstTradeAt }: PnlRangeDialogProps) {
	const [open, setOpen] = useState(false)
	const [isPending, startTransition] = useTransition()
	const router = useRouter()
	const [, setParams] = useQueryStates(RANGE_PARAMS, {
		history: "push",
		shallow: false,
		scroll: false,
		startTransition,
	})

	const { timezone: clientTimezone, setTimezone } = useTimezone()
	const timezone = clientTimezone ?? serverTimezone

	const initialRange = useMemo<DateRange | undefined>(() => {
		if (mode !== "custom") return undefined
		const fromDate = unixSecondsToDate(from)
		const toDate = unixSecondsToDate(to)
		if (!fromDate || !toDate) return undefined
		return { from: fromDate, to: toDate }
	}, [from, to, mode])

	const [draftRange, setDraftRange] = useState<DateRange | undefined>(initialRange)

	const firstTradeDate = useMemo(() => {
		if (firstTradeAt === undefined || !Number.isFinite(firstTradeAt)) return undefined
		const date = new Date(firstTradeAt * 1000)
		return Number.isNaN(date.getTime()) ? undefined : date
	}, [firstTradeAt])

	const label = mode === "preset" ? "Custom" : pnlRangeChipLabel({ mode, timeframe, anchor, from, to, timezone })

	function applyAnchor(nextAnchor: PnlAnchor) {
		posthog.capture("trader_pnl_range_changed", {
			mode: "anchor",
			timeframe,
			anchor: nextAnchor,
		})
		setParams({
			pnlAnchor: nextAnchor,
			pnlFrom: null,
			pnlTo: null,
		})
		setOpen(false)
	}

	function applyTimezone(nextTimezone: string) {
		if (nextTimezone === timezone) return
		posthog.capture("trader_pnl_timezone_changed", {
			timezone: nextTimezone,
			previous_timezone: timezone,
		})
		setTimezone(nextTimezone)
		startTransition(() => router.refresh())
	}

	function applyCustom() {
		if (!draftRange?.from || !draftRange?.to) return
		const nextFrom = startOfDayUtcSeconds(draftRange.from)
		const nextTo = endOfDayUtcSeconds(draftRange.to)
		posthog.capture("trader_pnl_range_changed", {
			mode: "custom",
			from: nextFrom,
			to: nextTo,
		})
		setParams({
			pnlAnchor: null,
			pnlFrom: nextFrom,
			pnlTo: nextTo,
		})
		setOpen(false)
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen)
		if (nextOpen) {
			setDraftRange(initialRange)
		}
	}

	const draftLabel = draftRange?.from
		? draftRange.to
			? draftRange.from.getTime() === draftRange.to.getTime()
				? formatDraftDate(draftRange.from)
				: `${formatDraftDate(draftRange.from)} – ${formatDraftDate(draftRange.to)}`
			: `${formatDraftDate(draftRange.from)} – pick end`
		: "Pick start date"

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn("h-7 gap-1.5 rounded-md px-2 font-medium tabular-nums", isPending && "opacity-70")}
						aria-label="Change time range"
					>
						<CalendarIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
						<span className="max-w-[18ch] truncate text-xs">{label}</span>
						<ChevronDownIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
					</Button>
				}
			/>
			<DialogContent className="bg-popover gap-0 overflow-hidden p-0 sm:max-w-sm">
				<DialogHeader className="border-b border-border/60 px-4 pt-4 pb-3">
					<DialogTitle>Time range</DialogTitle>
					<DialogDescription>Pick a preset, an anchor, or a custom date range.</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 px-4 pt-4 pb-3">
					<Section title="Start of">
						<div className="grid grid-cols-4 gap-1.5">
							{pnlAnchorValues.map((value) => (
								<PresetButton
									key={value}
									active={mode === "anchor" && anchor === value}
									onClick={() => applyAnchor(value)}
								>
									{ANCHOR_LABELS[value]}
								</PresetButton>
							))}
						</div>
					</Section>

					<Section title="Custom range">
						<Calendar
							mode="range"
							selected={draftRange}
							onSelect={setDraftRange}
							numberOfMonths={1}
							disabled={firstTradeDate ? { before: firstTradeDate, after: new Date() } : { after: new Date() }}
							startMonth={firstTradeDate}
							endMonth={new Date()}
							className="w-full mx-auto p-0 [--cell-size:--spacing(10)] bg-popover"
						/>
						<div className="flex items-center justify-between gap-2 pt-1">
							<span className="text-xs tabular-nums text-muted-foreground">{draftLabel}</span>
							<Button
								size="sm"
								variant={mode === "custom" ? "secondary" : "default"}
								disabled={!draftRange?.from || !draftRange?.to}
								onClick={applyCustom}
							>
								Apply range
							</Button>
						</div>
					</Section>
				</div>

				<div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-3">
					<div className="grid gap-0.5">
						<SectionTitle>Timezone</SectionTitle>
					</div>
					<TimezoneSelect
						value={timezone}
						onChange={applyTimezone}
						size="sm"
						className="min-w-52 text-xs"
					/>
				</div>

				<DialogClose className="sr-only">Close</DialogClose>
			</DialogContent>
		</Dialog>
	)
}

function SectionTitle({ children }: { children: ReactNode }) {
	return (
		<div className="px-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
			{children}
		</div>
	)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div className="grid gap-1.5">
			<SectionTitle>{title}</SectionTitle>
			{children}
		</div>
	)
}

function PresetButton({
	active,
	onClick,
	children,
}: {
	active: boolean
	onClick: () => void
	children: ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				"rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-colors",
				active
					? "border-foreground/20 bg-foreground/10 text-foreground"
					: "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
			)}
		>
			{children}
		</button>
	)
}
