"use client"

import type { ComboLeg, ComboLegDetail } from "@structbuild/sdk"
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { LayersIcon } from "lucide-react"

import {
	comboLegStatusLabel,
	comboStatusLabel,
	comboTypeDescription,
	comboTypeLabel,
	normalizeComboLegs,
	readComboStatus,
	readComboType,
	type ComboLegStatus,
	type NormalizedComboLeg,
} from "@/lib/combo"
import { formatPriceCents } from "@/lib/format"
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url"
import { cn, truncateMarketTitle } from "@/lib/utils"

import { Badge } from "./badge"
import { Popover, PopoverContent, PopoverHeader, PopoverTitle, PopoverTrigger } from "./popover"
import { TooltipWrapper } from "./tooltip"

export function ComboTypeBadge({ comboType, className }: { comboType: unknown; className?: string }) {
	const type = readComboType(comboType)
	if (!type) return null
	return (
		<TooltipWrapper content={comboTypeDescription(type)}>
			<Badge variant="combo" className={cn("cursor-help", className)}>
				<LayersIcon data-icon="inline-start" />
				{comboTypeLabel(type)}
			</Badge>
		</TooltipWrapper>
	)
}

export function ComboStatusBadge({ status, className }: { status: unknown; className?: string }) {
	const value = readComboStatus(status)
	if (!value) return null
	const variant =
		value === "resolved_win" || value === "redeemed"
			? "positive"
			: value === "resolved_loss"
				? "negative"
				: value === "redeemable"
					? "redeemable"
					: "secondary"
	return (
		<Badge variant={variant} className={className}>
			{comboStatusLabel(value)}
		</Badge>
	)
}

function legOutcomeVariant(outcomeIndex: number | null | undefined) {
	if (outcomeIndex === 0) return "positive" as const
	if (outcomeIndex === 1) return "negative" as const
	return "secondary" as const
}

function legStatusVariant(status: ComboLegStatus) {
	if (status === "won") return "positive" as const
	if (status === "lost") return "negative" as const
	return "secondary" as const
}

export function ComboLegsList({ legs }: { legs: NormalizedComboLeg[] }) {
	if (legs.length === 0) return null
	return (
		<ul className="flex flex-col gap-2">
			{legs.map((leg, index) => {
				const question = leg.question || leg.title || "Unknown market"
				const displayTitle = truncateMarketTitle(question)
				const imageUrl = leg.imageUrl ? normalizePolymarketS3ImageUrl(leg.imageUrl) : null
				const href = leg.slug ? (`/markets/${leg.slug}` as Route) : null
				const content = (
					<div className="flex min-w-0 items-center gap-2.5">
						{imageUrl ? (
							<Image
								className="size-8 shrink-0 rounded-md object-cover"
								alt={question}
								src={imageUrl}
								width={32}
								height={32}
							/>
						) : (
							<div className="size-8 shrink-0 rounded-md bg-muted" />
						)}
						<div className="min-w-0 flex-1 space-y-0.5">
							<p className="truncate text-sm font-medium text-foreground" title={question}>
								{displayTitle}
							</p>
							<div className="flex flex-wrap items-center gap-1.5">
								{leg.outcome ? (
									<Badge variant={legOutcomeVariant(leg.outcomeIndex)}>{leg.outcome}</Badge>
								) : null}
								{leg.status ? (
									<Badge variant={legStatusVariant(leg.status)}>{comboLegStatusLabel(leg.status)}</Badge>
								) : null}
								{leg.lastPrice != null ? (
									<span className="text-xs text-muted-foreground tabular-nums">
										{formatPriceCents(leg.lastPrice)}
									</span>
								) : null}
							</div>
						</div>
					</div>
				)
				return (
					<li key={leg.positionId || `${index}`}>
						{href ? (
							<Link href={href} prefetch={false} className="block rounded-md hover:bg-muted/50">
								{content}
							</Link>
						) : (
							content
						)}
					</li>
				)
			})}
		</ul>
	)
}

export function ComboLegsBadge({
	legs,
	className,
}: {
	legs: ReadonlyArray<ComboLeg | ComboLegDetail>
	className?: string
}) {
	if (legs.length === 0) return null
	const normalized = normalizeComboLegs(legs)
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Badge variant="combo" className={cn("cursor-pointer", className)}>
						<LayersIcon data-icon="inline-start" />
						{legs.length} {legs.length === 1 ? "leg" : "legs"}
					</Badge>
				}
			/>
			<PopoverContent align="start" className="w-80">
				<PopoverHeader>
					<PopoverTitle>Combo legs</PopoverTitle>
				</PopoverHeader>
				<ComboLegsList legs={normalized} />
			</PopoverContent>
		</Popover>
	)
}
