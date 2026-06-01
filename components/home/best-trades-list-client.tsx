"use client";

import type { MarketEntry, PnlTimeframe } from "@structbuild/sdk";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useState, useTransition } from "react";

import { getBestTradesAction } from "@/app/actions";
import { TraderTableCell } from "@/components/trader/trader-table-cell";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Volume } from "@/components/ui/volume";
import { formatNumber, pnlColorClass, readTotalPnlUsd } from "@/lib/format";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

export const BEST_TRADES_TIMEFRAMES = ["1d", "7d", "30d", "lifetime"] as const satisfies readonly PnlTimeframe[];

export type BestTradesTimeframe = (typeof BEST_TRADES_TIMEFRAMES)[number];

const BEST_TRADES_TIMEFRAME_LABELS: Record<BestTradesTimeframe, string> = {
	"1d": "1D",
	"7d": "7D",
	"30d": "30D",
	lifetime: "All",
};

function safeAbsoluteUrl(value: string | null | undefined): string | null {
	if (!value) return null;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
		return parsed.href;
	} catch {
		return null;
	}
}

function looksLikeOpaqueId(value: string): boolean {
	const trimmed = value.trim();
	if (trimmed.length < 12) return false;
	if (/^0x[0-9a-fA-F]+/.test(trimmed)) return true;
	if (/^[0-9]+$/.test(trimmed)) return true;
	if (/^[0-9a-fA-F]{20,}$/.test(trimmed)) return true;
	return false;
}

function readableMarketTitle(row: MarketEntry): string | null {
	const candidates = [row.question, row.title];
	for (const candidate of candidates) {
		if (candidate && !looksLikeOpaqueId(candidate)) return candidate;
	}
	if (row.market_slug && !looksLikeOpaqueId(row.market_slug)) return row.market_slug;
	if (row.event_slug && !looksLikeOpaqueId(row.event_slug)) return row.event_slug;
	return null;
}

type BestTradesListClientProps = {
	initialTrades: MarketEntry[];
	initialTimeframe: BestTradesTimeframe;
	limit: number;
};

export function BestTradesListClient({
	initialTrades,
	initialTimeframe,
	limit,
}: BestTradesListClientProps) {
	const [timeframe, setTimeframe] = useState<BestTradesTimeframe>(initialTimeframe);
	const [rows, setRows] = useState<MarketEntry[]>(initialTrades);
	const [isPending, startTransition] = useTransition();

	const handleTimeframeChange = useCallback(
		(next: BestTradesTimeframe) => {
			if (next === timeframe) return;
			setTimeframe(next);
			startTransition(async () => {
				const result = await getBestTradesAction({ timeframe: next, limit });
				setRows(result.rows);
			});
		},
		[timeframe, limit],
	);

	const toolbar = (
		<div className="flex w-full flex-col gap-3 justify-self-end sm:col-start-2 sm:row-start-1 sm:w-auto sm:items-end">
			<ToggleGroup
				aria-label="Best trades timeframe"
				value={[timeframe]}
				onValueChange={(next) => {
					const picked = next[0];
					if (!picked || picked === timeframe) return;
					handleTimeframeChange(picked as BestTradesTimeframe);
				}}
				variant="outline"
				size="sm"
				className="h-8"
			>
				{BEST_TRADES_TIMEFRAMES.map((tf) => (
					<ToggleGroupItem
						key={tf}
						value={tf}
						aria-label={BEST_TRADES_TIMEFRAME_LABELS[tf]}
						disabled={isPending}
					>
						{BEST_TRADES_TIMEFRAME_LABELS[tf]}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);

	if (rows.length === 0) {
		return (
			<>
				{toolbar}
				<div
					className={cn(
						"rounded-lg bg-card px-4 py-12 text-center text-sm text-muted-foreground sm:col-span-2 sm:row-start-2",
						isPending && "opacity-70",
					)}
					aria-busy={isPending}
				>
					No notable trades in this window.
				</div>
			</>
		);
	}

	return (
		<>
			{toolbar}
			<div
				className={cn(
					"overflow-hidden rounded-lg bg-card sm:col-span-2 sm:row-start-2",
					isPending && "opacity-70",
				)}
				aria-busy={isPending}
			>
				<Table>
					<TableHeader>
						<TableRow className="bg-card text-muted-foreground hover:bg-card">
							<TableHead className="w-12">#</TableHead>
							<TableHead className="w-[16rem]">Trader</TableHead>
							<TableHead>Market</TableHead>
							<TableHead className="w-32">PnL</TableHead>
							<TableHead className="w-28">Volume</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row, index) => {
							const pnl = readTotalPnlUsd(row);
							const marketTitle = readableMarketTitle(row);

							return (
								<TableRow
									key={`${row.condition_id ?? index}-${row.trader?.address ?? index}`}
									className="bg-card text-foreground/90 hover:bg-card"
								>
									<TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
									<TableCell>
										{row.trader ? (
											<TraderTableCell trader={row.trader} maxNameWidthClassName="max-w-[14rem]" />
										) : (
											<span className="text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										<MarketCell row={row} title={marketTitle} />
									</TableCell>
									<TableCell className={cn("font-medium tabular-nums", pnlColorClass(pnl))}>
										{formatNumber(pnl, { currency: true, compact: true })}
									</TableCell>
									<TableCell>
										<Volume usd={row.total_volume_usd ?? null} shares={null} className="tabular-nums" />
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</>
	);
}

function MarketCell({ row, title }: { row: MarketEntry; title: string | null }) {
	const href = row.market_slug
		? (`/markets/${row.market_slug}` as Route)
		: row.event_slug
			? (`/events/${row.event_slug}` as Route)
			: null;

	const imageSrc = safeAbsoluteUrl(normalizePolymarketS3ImageUrl(row.image_url));

	const content = (
		<div className="flex min-w-0 items-center gap-2">
			{imageSrc ? (
				<Avatar className="rounded-sm after:rounded-sm">
					<AvatarImage src={imageSrc} className="rounded-sm" />
				</Avatar>
			) : (
				<div className="size-8 shrink-0 rounded-sm bg-muted" />
			)}
			<span className="min-w-0 max-w-[24rem] truncate font-medium text-foreground">
				{title ?? <span className="italic text-muted-foreground">Untitled market</span>}
			</span>
		</div>
	);

	if (!href) return content;
	return (
		<Link href={href} prefetch={false} className="underline-offset-4 hover:underline">
			{content}
		</Link>
	);
}
