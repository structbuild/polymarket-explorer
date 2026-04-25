"use client"

import { startTransition, useRef, useTransition } from "react"
import { useQueryState } from "nuqs"

import { PnlChartContent } from "@/components/trader/pnl-chart"
import { PnlShareDialog } from "@/components/trader/pnl-share-dialog"
import { ShareIdentityHeader } from "@/components/trader/share-identity-header"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import type { PnlChartAnnotation, PnlDataPoint } from "@/lib/polymarket/pnl"
import { pnlTimeframeValues, type PnlTimeframe } from "@/lib/polymarket/pnl-timeframes"
import { pnlTimeframeParser } from "@/lib/trader-search-params"
import { cn } from "@/lib/utils"

const SHOW_HIGHLIGHTS_STORAGE_KEY = "polymarket-explorer:pnl-card:show-highlights"

type PnlCardProps = {
	data: PnlDataPoint[]
	displayName: string
	address: string
	profileImage?: string | null
	annotations?: PnlChartAnnotation[]
	timeframe: PnlTimeframe
}

function TimeframeSelector({
	value,
	onChange,
	isPending,
}: {
	value: PnlTimeframe
	onChange: (tf: PnlTimeframe) => void
	isPending: boolean
}) {
	return (
		<div className={cn("flex items-center rounded-md border bg-muted/50 p-0.5", isPending && "opacity-70")}>
			{pnlTimeframeValues.map((tf) => (
				<button
					key={tf}
					type="button"
					onClick={() => onChange(tf)}
					className={cn(
						"relative rounded-sm px-2 py-0.5 text-xs font-medium transition-colors",
						value === tf
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground"
					)}
				>
					{tf.toUpperCase()}
				</button>
			))}
		</div>
	)
}

export function PnlCard({ data, displayName, address, profileImage, annotations = [], timeframe }: PnlCardProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const [showAnnotations, setShowAnnotations] = useLocalStorage(SHOW_HIGHLIGHTS_STORAGE_KEY, false)
	const hasAnnotations = annotations.length > 0

	const [isPending, startNavTransition] = useTransition()
	const [, setTimeframe] = useQueryState("pnlTimeframe", {
		...pnlTimeframeParser,
		shallow: false,
		startTransition: startNavTransition,
	})

	const showChartAnnotations = timeframe === "all" && showAnnotations

	return (
		<div ref={cardRef} className="group/share-card rounded-lg bg-card p-4 sm:p-6">
			<ShareIdentityHeader address={address} displayName={displayName} profileImage={profileImage} />
			<PnlChartContent
				data={data}
				annotations={annotations}
				showAnnotations={showChartAnnotations}
				action={
					<div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
						{hasAnnotations && timeframe === "all" ? (
							<Button
								variant={showAnnotations ? "secondary" : "ghost"}
								size="xs"
								aria-pressed={showAnnotations}
								onClick={() => startTransition(() => setShowAnnotations((current) => !current))}
							>
								Highlights
							</Button>
						) : null}
						<TimeframeSelector value={timeframe} onChange={(tf) => setTimeframe(tf)} isPending={isPending} />
						<PnlShareDialog address={address} displayName={displayName} targetRef={cardRef} />
					</div>
				}
			/>
		</div>
	)
}
