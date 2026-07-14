import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { ComboMarketStatusBadge, ComboTypeBadge } from "@/components/ui/combo";
import { formatDateShort, formatNumber, formatPriceCents } from "@/lib/format";
import { truncateAddress } from "@/lib/utils";
import type { ComboMarket } from "@structbuild/sdk";

export function buildComboTitle(combo: Pick<ComboMarket, "legs" | "leg_count">): string {
	const parts = (combo.legs ?? [])
		.map((leg) => (leg.title ?? leg.question ?? "").trim())
		.filter(Boolean);
	const legCount = combo.leg_count ?? combo.legs?.length ?? parts.length;
	if (parts.length === 0) {
		return `${legCount}-Leg Combo`;
	}
	const joined = parts.slice(0, 2).join(" + ");
	const remaining = parts.length - 2;
	return remaining > 0 ? `${joined} +${remaining} more` : joined;
}

function StatItem({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="min-w-0 space-y-1 sm:shrink-0">
			<p className="text-xs leading-4 text-muted-foreground sm:whitespace-nowrap sm:text-sm">{label}</p>
			<p className="text-base font-medium tabular-nums break-words sm:text-lg sm:break-normal sm:whitespace-nowrap">
				{value}
			</p>
		</div>
	);
}

export function ComboDetailHeader({ combo }: { combo: ComboMarket }) {
	const legCount = combo.leg_count ?? combo.legs.length;
	const title = buildComboTitle(combo);
	const impliedYes = combo.implied_probability_yes;
	const impliedYesLabel = impliedYes != null ? `${(impliedYes * 100).toFixed(1)}%` : "—";
	const creator = combo.creator ?? null;

	return (
		<div className="bg-card flex min-w-0 flex-col gap-5 rounded-lg p-6">
			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<ComboTypeBadge comboType={combo.combo_type} />
					<ComboMarketStatusBadge status={combo.status} />
					<Badge variant="secondary" className="h-6 px-2.5 text-xs">
						{legCount}-leg parlay
					</Badge>
				</div>
				<h1 className="text-2xl font-medium tracking-tight">{title}</h1>
				<div className="flex flex-wrap items-center gap-1.5">
					{combo.legs_won > 0 && <Badge variant="positive">{combo.legs_won} won</Badge>}
					{combo.legs_lost > 0 && <Badge variant="negative">{combo.legs_lost} lost</Badge>}
					{combo.legs_pending > 0 && <Badge variant="secondary">{combo.legs_pending} pending</Badge>}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-nowrap sm:items-center sm:gap-x-8 sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
				<StatItem label="Implied odds (Yes)" value={impliedYesLabel} />
				<StatItem label="Price" value={formatPriceCents(combo.price ?? null)} />
				<StatItem label="Volume" value={formatNumber(combo.usd_volume ?? 0, { compact: true, currency: true })} />
				<StatItem label="Trades" value={formatNumber(combo.txns ?? 0, { decimals: 0 })} />
				<StatItem label="Traders" value={formatNumber(combo.unique_traders ?? 0, { decimals: 0 })} />
				<StatItem label="Fees" value={formatNumber(combo.fees ?? 0, { currency: true, decimals: 0 })} />
				<StatItem label="Created" value={formatDateShort(combo.created_at)} />
			</div>

			{creator && (
				<p className="text-sm text-muted-foreground">
					Created by{" "}
					<Link
						href={`/traders/${creator}` as Route}
						prefetch={false}
						className="font-mono text-foreground transition-colors hover:text-primary"
					>
						{truncateAddress(creator, 4)}
					</Link>
				</p>
			)}
		</div>
	);
}
