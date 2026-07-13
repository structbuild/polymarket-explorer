"use client"

import type { ComboLeg } from "@structbuild/sdk"
import type { Route } from "next"
import Image from "next/image"
import Link from "next/link"
import { LayersIcon } from "lucide-react"

import { comboTypeDescription, comboTypeLabel, readComboType } from "@/lib/combo"
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

function legOutcomeVariant(outcomeIndex: number | null | undefined) {
	if (outcomeIndex === 0) return "positive" as const
	if (outcomeIndex === 1) return "negative" as const
	return "secondary" as const
}

export function ComboLegsBadge({ legs, className }: { legs: ComboLeg[]; className?: string }) {
	if (legs.length === 0) return null
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
				<ul className="flex flex-col gap-2">
					{legs.map((leg, index) => {
						const question = leg.question || leg.title || "Unknown market"
						const displayTitle = truncateMarketTitle(question)
						const imageUrl = leg.image_url ? normalizePolymarketS3ImageUrl(leg.image_url) : null
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
									{leg.outcome ? (
										<Badge variant={legOutcomeVariant(leg.outcome_index)}>{leg.outcome}</Badge>
									) : null}
								</div>
							</div>
						)
						return (
							<li key={leg.position_id || `${index}`}>
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
			</PopoverContent>
		</Popover>
	)
}
