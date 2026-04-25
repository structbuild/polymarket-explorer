"use client";

import { useRef } from "react";
import type { TraderPnlSummary } from "@structbuild/sdk";

import { DnaShareDialog } from "@/components/trader/dna-share-dialog";
import { ShareIdentityHeader } from "@/components/trader/share-identity-header";
import { TraderDnaRadar } from "@/components/trader/trader-dna-radar";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";
import {
	computeTraderDna,
	type TraderArchetypeId,
} from "@/lib/polymarket/trader-archetype";

type TraderDnaCardProps = {
	pnlSummary: TraderPnlSummary | null;
	cumulativePnlUsd: number;
	address: string;
	displayName: string;
	profileImage?: string | null;
};

const ARCHETYPE_CLASSES: Record<TraderArchetypeId, string> = {
	whale: "bg-blue-500/20 text-blue-500",
	pro: "bg-emerald-500/20 text-emerald-500",
	sniper: "bg-violet-500/20 text-violet-500",
	hodler: "bg-sky-500/20 text-sky-500",
	scalper: "bg-amber-500/20 text-amber-500",
	degen: "bg-red-500/20 text-red-500",
	generalist: "bg-teal-500/20 text-teal-500",
	rookie: "bg-muted text-muted-foreground",
	trader: "bg-muted text-foreground",
};

export function TraderDnaCard({ pnlSummary, cumulativePnlUsd, address, displayName, profileImage }: TraderDnaCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);

	if (!pnlSummary) return null;
	const dna = computeTraderDna({ summary: pnlSummary, cumulativePnlUsd });

	return (
		<div ref={cardRef} className="group/share-card rounded-lg bg-card p-4 sm:p-6">
			<ShareIdentityHeader address={address} displayName={displayName} profileImage={profileImage} />
			<div className="mb-3 flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5">
					<h2 className="text-sm text-foreground sm:text-base">Trader DNA</h2>
					<span className="group-data-[share-mode=image]/share-card:hidden">
						<InfoTooltip content="Seven-axis profile built from lifetime stats. Each axis is a 0–100 score relative to a fixed reference scale; the dashed polygon is the peer baseline (50)." />
					</span>
				</div>
				<div className="flex items-center gap-1">
					<Badge className={cn("text-xs uppercase tracking-wide", ARCHETYPE_CLASSES[dna.archetype.id])}>
						{dna.archetype.label}
					</Badge>
					<DnaShareDialog address={address} displayName={displayName} targetRef={cardRef} />
				</div>
			</div>

			<TraderDnaRadar axes={dna.axes} />
		</div>
	);
}
