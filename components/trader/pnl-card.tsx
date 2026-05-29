"use client"

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useQueryState } from "nuqs"

import { ChartSettingsButton, PnlChartContent, type PnlChartMetric, type PnlChartMode } from "@/components/trader/pnl-chart"
import { PnlRangeDialog } from "@/components/trader/pnl-range-dialog"
import { PnlTimeframeSelector } from "@/components/trader/pnl-timeframe-selector"
import { PnlShareDialog } from "@/components/trader/pnl-share-dialog"
import { ShareIdentityHeader } from "@/components/trader/share-identity-header"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import { usePnlPeriodWindow } from "@/lib/hooks/use-pnl-period-window"
import { useTimezone } from "@/lib/hooks/use-timezone"
import type { PnlChartAnnotation, PnlChartExit, PnlDataPoint } from "@/lib/struct/pnl"
import type { ResolvedPnlRange } from "@/lib/struct/pnl-range"
import { pnlFillGapsParser } from "@/lib/trader-search-params"
import { cn } from "@/lib/utils"

const SHOW_HIGHLIGHTS_STORAGE_KEY = "polymarket-explorer:pnl-card:show-highlights"
const SHOW_WIN_EXITS_STORAGE_KEY = "polymarket-explorer:pnl-card:show-win-exits"
const SHOW_LOSS_EXITS_STORAGE_KEY = "polymarket-explorer:pnl-card:show-loss-exits"
const FILL_GAPS_STORAGE_KEY = "polymarket-explorer:pnl-card:fill-gaps"

type PnlCardProps = {
	data: PnlDataPoint[]
	displayName: string
	address: string
	profileImage?: string | null
	annotations?: PnlChartAnnotation[]
	exits?: PnlChartExit[]
	pnlRange: ResolvedPnlRange
	pnlFillGaps: boolean
	firstTradeAt?: number
}

export function PnlCard({ data, displayName, address, profileImage, annotations = [], exits = [], pnlRange, pnlFillGaps, firstTradeAt }: PnlCardProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const [chartMode, setChartMode] = useState<PnlChartMode>("area")
	const [chartMetric, setChartMetric] = useState<PnlChartMetric>("pnl")
	const [showAnnotations, setShowAnnotations] = useLocalStorage(SHOW_HIGHLIGHTS_STORAGE_KEY, false)
	const [showWinExits, setShowWinExits] = useLocalStorage(SHOW_WIN_EXITS_STORAGE_KEY, false)
	const [showLossExits, setShowLossExits] = useLocalStorage(SHOW_LOSS_EXITS_STORAGE_KEY, false)
	const [periodWindow] = usePnlPeriodWindow()
	const { timezone: clientTimezone } = useTimezone()
	const timezone = clientTimezone ?? pnlRange.timezone

	const [, startFillGapsTransition] = useTransition()
	const [, setFillGaps] = useQueryState("pnlFillGaps", {
		...pnlFillGapsParser,
		history: "push",
		shallow: false,
		scroll: false,
		startTransition: startFillGapsTransition,
	})
	const [storedFillGaps, setStoredFillGaps] = useLocalStorage<boolean>(FILL_GAPS_STORAGE_KEY, true)

	useEffect(() => {
		if (storedFillGaps !== pnlFillGaps) {
			setFillGaps(storedFillGaps ? null : false)
		}
	}, [storedFillGaps, pnlFillGaps, setFillGaps])

	const windowAnnotations = useMemo(
		() => annotations.filter((annotation) => annotation.window === periodWindow),
		[annotations, periodWindow],
	)
	const hasAnnotations = annotations.length > 0
	const hasWinExits = useMemo(() => exits.some((exit) => exit.pnlUsd >= 0), [exits])
	const hasLossExits = useMemo(() => exits.some((exit) => exit.pnlUsd < 0), [exits])

	const annotationsEligible = pnlRange.mode === "preset" && pnlRange.timeframe === "all"
	const showChartAnnotations = annotationsEligible && showAnnotations
	const showTooltipTime = data.length > 1 ? data[1].t - data[0].t < 86_400 : pnlRange.resolution !== "1d"
	const highlightsAvailable = hasAnnotations && annotationsEligible

	const handleHighlightsChange = useCallback(
		(next: boolean) => {
			setShowAnnotations(next)
		},
		[setShowAnnotations],
	)

	const handleWinExitsChange = useCallback(
		(next: boolean) => {
			setShowWinExits(next)
		},
		[setShowWinExits],
	)

	const handleLossExitsChange = useCallback(
		(next: boolean) => {
			setShowLossExits(next)
		},
		[setShowLossExits],
	)

	const handleFillGapsChange = useCallback(
		(next: boolean) => {
			setStoredFillGaps(next)
			setFillGaps(next ? null : false)
		},
		[setFillGaps, setStoredFillGaps],
	)

	return (
		<div ref={cardRef} className={cn("group/share-card rounded-lg bg-card p-4 sm:p-6")}>
			<ShareIdentityHeader address={address} displayName={displayName} profileImage={profileImage} />
			<PnlChartContent
				data={data}
				annotations={windowAnnotations}
				showAnnotations={showChartAnnotations}
				exits={exits}
				showWinExits={showWinExits}
				showLossExits={showLossExits}
				timeframe={pnlRange.timeframe}
				timezone={timezone}
				showTooltipTime={showTooltipTime}
				chartMode={chartMode}
				chartMetric={chartMetric}
				action={
					<div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
						<PnlTimeframeSelector active={pnlRange.mode === "preset" ? pnlRange.timeframe : null} />
						<PnlRangeDialog
							mode={pnlRange.mode}
							timeframe={pnlRange.timeframe}
							anchor={pnlRange.anchor}
							from={pnlRange.from}
							to={pnlRange.to}
							timezone={timezone}
							firstTradeAt={firstTradeAt}
						/>
						<ChartSettingsButton
							chartMode={chartMode}
							onChartModeChange={setChartMode}
							chartMetric={chartMetric}
							onChartMetricChange={setChartMetric}
							highlightsAvailable={highlightsAvailable}
							highlightsActive={showAnnotations}
							onHighlightsChange={handleHighlightsChange}
							winExitsAvailable={hasWinExits}
							winExitsActive={showWinExits}
							onWinExitsChange={handleWinExitsChange}
							lossExitsAvailable={hasLossExits}
							lossExitsActive={showLossExits}
							onLossExitsChange={handleLossExitsChange}
							fillGapsActive={storedFillGaps}
							onFillGapsChange={handleFillGapsChange}
						/>
						<PnlShareDialog address={address} displayName={displayName} targetRef={cardRef} />
					</div>
				}
			/>
		</div>
	)
}
