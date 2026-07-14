"use client"

import type { V31ComboPnlResponse } from "@structbuild/sdk"
import { LayersIcon, Loader2Icon } from "lucide-react"
import { useCallback, useState } from "react"

import { getTraderComboLegsAction } from "@/app/actions"
import { comboTypeLabel, normalizeComboLegs, readComboType } from "@/lib/combo"
import { formatNumber } from "@/lib/format"

import { Badge } from "../ui/badge"
import { ComboLegsList, ComboStatusBadge } from "../ui/combo"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "../ui/popover"

type LoadState =
	| { status: "idle" }
	| { status: "loading" }
	| { status: "loaded"; combo: V31ComboPnlResponse | null }

export function TraderComboLegs({
	address,
	positionId,
	conditionId,
	comboType,
	className,
}: {
	address: string
	positionId?: string | null
	conditionId?: string | null
	comboType?: unknown
	className?: string
}) {
	const [state, setState] = useState<LoadState>({ status: "idle" })
	const type = readComboType(comboType)
	const label = type ? comboTypeLabel(type) : "Legs"

	const load = useCallback(async () => {
		setState({ status: "loading" })
		try {
			const combo = await getTraderComboLegsAction({ address, positionId, conditionId })
			setState({ status: "loaded", combo })
		} catch {
			setState({ status: "loaded", combo: null })
		}
	}, [address, conditionId, positionId])

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (open && state.status === "idle") {
				void load()
			}
		},
		[load, state.status],
	)

	return (
		<Popover onOpenChange={handleOpenChange}>
			<PopoverTrigger
				nativeButton={false}
				render={
					<Badge variant="combo" className={className} style={{ cursor: "pointer" }}>
						<LayersIcon data-icon="inline-start" />
						{label}
					</Badge>
				}
			/>
			<PopoverContent align="start" className="w-80">
				<PopoverHeader>
					<PopoverTitle>Combo legs</PopoverTitle>
				</PopoverHeader>
				{state.status === "loading" || state.status === "idle" ? (
					<div className="flex items-center gap-2 py-2 text-muted-foreground">
						<Loader2Icon className="size-4 animate-spin" />
						Loading legs…
					</div>
				) : state.combo && state.combo.legs.length > 0 ? (
					<ComboLegsSummary combo={state.combo} />
				) : (
					<p className="py-2 text-muted-foreground">No leg breakdown available.</p>
				)}
			</PopoverContent>
		</Popover>
	)
}

function ComboLegsSummary({ combo }: { combo: V31ComboPnlResponse }) {
	const impliedProbability = combo.implied_probability
	const potentialPayout = combo.potential_payout

	return (
		<div className="flex flex-col gap-2.5">
			<div className="flex flex-wrap items-center gap-1.5">
				<ComboStatusBadge status={combo.status} />
				{combo.legs_won > 0 ? <Badge variant="positive">{combo.legs_won} won</Badge> : null}
				{combo.legs_lost > 0 ? <Badge variant="negative">{combo.legs_lost} lost</Badge> : null}
				{combo.legs_pending > 0 ? <Badge variant="secondary">{combo.legs_pending} pending</Badge> : null}
			</div>
			{impliedProbability != null || potentialPayout != null ? (
				<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
					{impliedProbability != null ? (
						<span>
							Implied odds{" "}
							<span className="font-medium text-foreground tabular-nums">
								{formatNumber(impliedProbability * 100, { decimals: 1 })}%
							</span>
						</span>
					) : null}
					{potentialPayout != null ? (
						<span>
							Payout if won{" "}
							<span className="font-medium text-foreground tabular-nums">
								{formatNumber(potentialPayout, { currency: true, compact: true })}
							</span>
						</span>
					) : null}
				</div>
			) : null}
			<ComboLegsList legs={normalizeComboLegs(combo.legs)} />
		</div>
	)
}
