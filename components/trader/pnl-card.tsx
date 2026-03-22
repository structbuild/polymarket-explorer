"use client"

import { startTransition, useRef } from "react"
import { Facehash } from "facehash"

import { PnlChartContent } from "@/components/trader/pnl-chart"
import { PnlShareDialog } from "@/components/trader/pnl-share-dialog"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/lib/hooks/use-local-storage"
import type { PnlChartAnnotation, PnlDataPoint } from "@/lib/polymarket/pnl"
import { StructLogo } from "@/components/ui/svgs/struct-logo"
import { truncateAddress } from "@/lib/utils"

const SHOW_HIGHLIGHTS_STORAGE_KEY = "polymarket-explorer:pnl-card:show-highlights"

type PnlCardProps = {
	data: PnlDataPoint[]
	displayName: string
	address: string
	annotations?: PnlChartAnnotation[]
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

export function PnlCard({ data, displayName, address, annotations = [] }: PnlCardProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const [showAnnotations, setShowAnnotations] = useLocalStorage(SHOW_HIGHLIGHTS_STORAGE_KEY, false)
	const hasAnnotations = annotations.length > 0

	return (
		<div ref={cardRef} className="group/share-card rounded-lg bg-card p-4 sm:p-6">
			<ShareIdentityHeader address={address} displayName={displayName} />
			<PnlChartContent
				data={data}
				annotations={annotations}
				showAnnotations={showAnnotations}
				action={
					<div className="flex items-center gap-2">
						{hasAnnotations ? (
							<Button
								variant={showAnnotations ? "secondary" : "ghost"}
								size="xs"
								aria-pressed={showAnnotations}
								onClick={() => startTransition(() => setShowAnnotations((current) => !current))}
							>
								Highlights
							</Button>
						) : null}
						<PnlShareDialog address={address} displayName={displayName} targetRef={cardRef} />
					</div>
				}
			/>
		</div>
	)
}
