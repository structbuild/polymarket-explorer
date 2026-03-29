"use client"

import { startTransition, useRef, useTransition } from "react"
import { Facehash } from "facehash"
import { useQueryState } from "nuqs"

import { PnlChartContent } from "@/components/trader/pnl-chart"
import { PnlShareDialog } from "@/components/trader/pnl-share-dialog"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import type { PnlChartAnnotation, PnlDataPoint } from "@/lib/polymarket/pnl"
import { pnlTimeframeValues, type PnlTimeframe } from "@/lib/polymarket/pnl-timeframes"
import { pnlTimeframeParser } from "@/lib/trader-search-params"
import { StructLogo } from "@/components/ui/svgs/struct-logo"
import { cn, truncateAddress } from "@/lib/utils"

const SHOW_HIGHLIGHTS_STORAGE_KEY = "polymarket-explorer:pnl-card:show-highlights"

type PnlCardProps = {
	data: PnlDataPoint[]
	displayName: string
	address: string
	annotations?: PnlChartAnnotation[]
	timeframe: PnlTimeframe
}

type ShareIdentityHeaderProps = {
	address: string
	displayName: string
}

function ShareIdentityHeader({ address, displayName }: ShareIdentityHeaderProps) {
	return (
			<div className="mb-5 hidden items-center gap-3 border-b border-border/70 pb-4 group-data-[share-mode=image]/share-card:flex">
				<Facehash
					className="size-10 shrink-0 overflow-hidden rounded-md border"
					colorClasses={[
					"bg-slate-500",
					"bg-gray-500",
					"bg-zinc-500",
					"bg-neutral-500",
					"bg-stone-500",
					"bg-red-500",
					"bg-orange-500",
					"bg-amber-500",
					"bg-yellow-500",
					"bg-lime-500",
					"bg-green-500",
					"bg-emerald-500",
					"bg-teal-500",
					"bg-cyan-500",
					"bg-sky-500",
					"bg-blue-500",
					"bg-indigo-500",
					"bg-violet-500",
					"bg-purple-500",
					"bg-fuchsia-500",
					"bg-pink-500",
					"bg-rose-500",
				]}
				name={address}
			/>
			<div className="min-w-0">
				<p className="truncate text-sm font-medium text-foreground">{displayName}</p>
				<p className="font-mono text-xs text-muted-foreground">{truncateAddress(address, 6)}</p>
			</div>
			<p className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
				Powered by <StructLogo className="h-3 text-foreground" />
			</p>
		</div>
	)
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

export function PnlCard({ data, displayName, address, annotations = [], timeframe }: PnlCardProps) {
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
			<ShareIdentityHeader address={address} displayName={displayName} />
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
