"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Volume } from "@/components/ui/volume";
import type { EventMarketRow } from "@/lib/event-markets-table-map";
import { formatDateShort, formatNumber } from "@/lib/format";
import { cn, truncateMarketTitle } from "@/lib/utils";

const SHOW_LESS_THRESHOLD = 12;

type SortKey = "probability" | "volume" | "liquidity";
type SortDirection = "asc" | "desc";

function compareNullable(
	a: number | null | undefined,
	b: number | null | undefined,
	direction: SortDirection,
): number {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	return direction === "asc" ? a - b : b - a;
}

function ProbabilityCell({ market }: { market: EventMarketRow }) {
	if (market.isResolved) {
		if (!market.resolvedOutcomeName) {
			return <span className="text-muted-foreground tabular-nums">—</span>;
		}
		return (
			<span className="inline-flex flex-col leading-tight">
				<span className="text-sm font-medium text-foreground">{market.resolvedOutcomeName}</span>
				<span className="text-xs text-muted-foreground">
					Resolved
				</span>
			</span>
		);
	}

	if (market.yesPrice == null) {
		return <span className="text-muted-foreground tabular-nums">—</span>;
	}

	return (
		<span className="text-base font-semibold tabular-nums">
			{Math.round(market.yesPrice * 100)}%
		</span>
	);
}

function MarketCell({ market }: { market: EventMarketRow }) {
	const title = market.title;
	const displayTitle = truncateMarketTitle(title);
	const imageUrl = market.imageUrl;
	const href = market.slug ? (`/markets/${market.slug}` as Route) : null;

	const inner = (
		<div className="flex min-w-0 items-center gap-3">
			{imageUrl ? (
				<Image
					src={imageUrl}
					alt={title}
					width={40}
					height={40}
					className="size-10 shrink-0 rounded-md object-cover"
				/>
			) : (
				<div className="size-10 shrink-0 rounded-md bg-muted" />
			)}
			<span className="line-clamp-2 min-w-0 text-sm font-medium leading-snug underline-offset-4 group-hover:underline" title={title}>
				{displayTitle}
			</span>
		</div>
	);

	if (!href) return inner;

	return (
		<Link href={href} prefetch={false} className="group flex min-w-0 items-center">
			{inner}
		</Link>
	);
}

export function EventMarketsTable({ markets }: { markets: EventMarketRow[] }) {
	const [sortKey, setSortKey] = useState<SortKey>("probability");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [showAll, setShowAll] = useState(false);

	const handleSort = (next: SortKey) => {
		if (next === sortKey) {
			setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(next);
			setSortDirection("desc");
		}
	};

	const sorted = useMemo(() => {
		const copy = markets.filter((m) => m.slug);
		switch (sortKey) {
			case "volume":
				copy.sort((a, b) => compareNullable(a.volume24hr, b.volume24hr, sortDirection));
				break;
			case "liquidity":
				copy.sort((a, b) => compareNullable(a.liquidityUsd, b.liquidityUsd, sortDirection));
				break;
			case "probability":
				copy.sort((a, b) => {
					if (a.isResolved !== b.isResolved) return a.isResolved ? 1 : -1;
					return compareNullable(a.yesPrice, b.yesPrice, sortDirection);
				});
				break;
		}
		return copy;
	}, [markets, sortKey, sortDirection]);

	const visible = showAll || sorted.length <= SHOW_LESS_THRESHOLD ? sorted : sorted.slice(0, SHOW_LESS_THRESHOLD);
	const hiddenCount = sorted.length - visible.length;

	if (sorted.length === 0) {
		return (
			<div className="rounded-lg bg-card px-4 py-12 text-center text-muted-foreground">
				No markets in this event.
			</div>
		);
	}

	const anyLiquidity = sorted.some((m) => (m.liquidityUsd ?? 0) > 0);
	const anyEnd = sorted.some((m) => m.endTime != null);

	return (
		<div className="space-y-4">
			<h2 className="text-lg font-medium tracking-tight">Markets</h2>

			<div className="overflow-x-auto rounded-lg border bg-card">
				<Table className="table-fixed [&_tr>*:first-child]:pl-6 [&_tr>*:last-child]:pr-6">
					<TableHeader>
						<TableRow className="hover:bg-transparent">
							<TableHead className="w-auto">Market</TableHead>
							<TableHead className="w-[140px]">
								<SortableHeader
									table="event_markets"
									sortBy="probability"
									currentSortBy={sortKey}
									currentSortDirection={sortDirection}
									onSortChange={handleSort}
								>
									Probability
								</SortableHeader>
							</TableHead>
							<TableHead className="w-[140px]">
								<SortableHeader
									table="event_markets"
									sortBy="volume"
									currentSortBy={sortKey}
									currentSortDirection={sortDirection}
									onSortChange={handleSort}
								>
									24h Volume
								</SortableHeader>
							</TableHead>
							{anyLiquidity && (
								<TableHead className="w-[140px]">
									<SortableHeader
										table="event_markets"
										sortBy="liquidity"
										currentSortBy={sortKey}
										currentSortDirection={sortDirection}
										onSortChange={handleSort}
									>
										Liquidity
									</SortableHeader>
								</TableHead>
							)}
							{anyEnd && <TableHead className="w-[140px]">Ends</TableHead>}
						</TableRow>
					</TableHeader>
					<TableBody>
						{visible.map((market) => {
							const rowHref = market.slug ? (`/markets/${market.slug}` as Route) : null;
							return (
							<TableRow
								key={market.conditionId || market.slug || market.id || ""}
								className={cn(
									rowHref &&
										"relative cursor-pointer [&_a:not([data-row-link])]:relative [&_a:not([data-row-link])]:z-10",
								)}
							>
								<TableCell className="align-middle">
									{rowHref ? (
										<Link
											href={rowHref}
											prefetch={false}
											tabIndex={-1}
											aria-hidden="true"
											data-row-link=""
											className="absolute inset-0 z-0"
										/>
									) : null}
									<MarketCell market={market} />
								</TableCell>
								<TableCell className="align-middle">
									<ProbabilityCell market={market} />
								</TableCell>
								<TableCell className="align-middle tabular-nums">
									<Volume usd={market.volume24hr ?? 0} shares={null} />
								</TableCell>
								{anyLiquidity && (
									<TableCell className="align-middle tabular-nums">
										{formatNumber(market.liquidityUsd ?? 0, { compact: true, currency: true })}
									</TableCell>
								)}
								{anyEnd && (
									<TableCell className="align-middle text-muted-foreground tabular-nums">
										{market.endTime != null ? formatDateShort(market.endTime) : "—"}
									</TableCell>
								)}
							</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			{hiddenCount > 0 && (
				<div className="flex justify-center">
					<Button
						variant="ghost"
						onClick={() => {
							posthog.capture("event_markets_show_more_clicked", { hidden_count: hiddenCount });
							setShowAll(true);
						}}
					>
						Show {hiddenCount} more <ChevronDownIcon className="size-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
