"use client";

import {
	searchAction,
	type SearchResult,
	type SearchResultBuilder,
	type SearchResultMarket,
	type SearchResultTrader,
} from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatNumber } from "@/lib/format";
import { cn, formatBuilderCodeDisplay, getTraderDisplayName, isBytes32Hex, normalizeWalletAddress } from "@/lib/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { BarChart3Icon, BlocksIcon, LoaderIcon, SearchIcon, UserIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import posthog from "posthog-js";
import { type ReactNode, useCallback, useEffect, useRef, useState, useTransition } from "react";

const DEBOUNCE_MS = 300;
const OPEN_EVENT = "search-dialog:open";

const RESOLVED_STATUSES = new Set(["resolved", "closed"]);
const UNPREFIXED_BYTES32_HEX_PATTERN = /^[0-9a-fA-F]{64}$/;

function capitalize(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusDotClass(status: string | null) {
	if (!status) return "bg-muted-foreground/40";
	const lowered = status.toLowerCase();
	if (lowered === "active" || lowered === "open") return "bg-emerald-500";
	if (RESOLVED_STATUSES.has(lowered)) return "bg-muted-foreground/60";
	return "bg-amber-500";
}

function normalizeBuilderCodeQuery(value: string) {
	const trimmed = value.trim();
	if (isBytes32Hex(trimmed)) return trimmed.toLowerCase();
	if (UNPREFIXED_BYTES32_HEX_PATTERN.test(trimmed)) return `0x${trimmed.toLowerCase()}`;
	return null;
}

function SearchRow({
	href,
	onSelect,
	imageUrl,
	fallback,
	title,
	meta,
}: {
	href: Route;
	onSelect: () => void;
	imageUrl?: string | null;
	fallback: ReactNode;
	title: string;
	meta?: ReactNode;
}) {
	return (
		<Link
			href={href}
			prefetch={false}
			onClick={onSelect}
			className="flex min-w-0 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent"
		>
			<Avatar size="default">
				{imageUrl && <AvatarImage src={imageUrl} />}
				<AvatarFallback>{fallback}</AvatarFallback>
			</Avatar>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className="truncate text-sm" title={title}>
					{title}
				</span>
				{meta && (
					<div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
						{meta}
					</div>
				)}
			</div>
		</Link>
	);
}

function MarketMeta({ market }: { market: SearchResultMarket }) {
	const status = market.status?.toLowerCase() ?? null;
	const isResolved = status != null && RESOLVED_STATUSES.has(status);
	const primaryOutcome =
		market.outcomes.find((o) => o.name.toLowerCase() === "yes") ?? market.outcomes[0] ?? null;
	const showProbability = !isResolved && primaryOutcome?.price != null;

	const lifetimeVolume =
		market.volume_lifetime_usd != null && market.volume_lifetime_usd > 0 ? market.volume_lifetime_usd : null;
	const dailyVolume =
		market.volume_24hr_usd != null && market.volume_24hr_usd > 0 ? market.volume_24hr_usd : null;
	const volumeDisplay = lifetimeVolume
		? { value: lifetimeVolume, suffix: "vol" }
		: dailyVolume
			? { value: dailyVolume, suffix: "vol" }
			: null;

	const parts: ReactNode[] = [];
	if (market.status) {
		parts.push(
			<span key="status" className="inline-flex items-center gap-1">
				<span className={cn("size-1.5 rounded-full", statusDotClass(status))} aria-hidden />
				{capitalize(market.status)}
			</span>,
		);
	}
	if (showProbability && primaryOutcome) {
		parts.push(
			<span key="prob" className="font-medium text-foreground/80">
				{Math.round((primaryOutcome.price ?? 0) * 100)}% {primaryOutcome.name}
			</span>,
		);
	}
	if (volumeDisplay) {
		parts.push(
			<span key="vol">
				{formatNumber(volumeDisplay.value, { compact: true, currency: true })} {volumeDisplay.suffix}
			</span>,
		);
	}

	return (
		<>
			{parts.map((part, i) => (
				<span key={i} className="inline-flex items-center gap-1.5">
					{i > 0 && <span className="text-muted-foreground/40">·</span>}
					{part}
				</span>
			))}
		</>
	);
}

function BuilderMeta({ builder }: { builder: SearchResultBuilder }) {
	return (
		<span className="truncate font-mono text-[11px]">
			{formatBuilderCodeDisplay(builder.builder_code)}
		</span>
	);
}

function TraderMeta({ trader }: { trader: SearchResultTrader }) {
	if (trader.volume_usd != null && trader.volume_usd > 0) {
		return <span>{formatNumber(trader.volume_usd, { compact: true, currency: true })} vol</span>;
	}
	return <span className="truncate font-mono text-[11px]">{trader.address}</span>;
}

export function openSearchDialog() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(OPEN_EVENT));
	}
}

export function SearchDialog() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult>({ traders: [], markets: [], builders: [] });
	const [isMobile, setIsMobile] = useState(false);
	const [isPending, startTransition] = useTransition();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const requestIdRef = useRef(0);
	const cachedResultsRef = useRef(new Map<string, SearchResult>());
	const inFlightRequestsRef = useRef(new Map<string, Promise<SearchResult>>());

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		requestIdRef.current += 1;
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setOpen(nextOpen);
		if (nextOpen) {
			posthog.capture("search_opened");
		} else {
			setQuery("");
			setResults({ traders: [], markets: [], builders: [] });
		}
	}, []);

	useHotkey("Mod+K", (event) => {
		event.preventDefault();
		handleOpenChange(!open);
	});

	useEffect(() => {
		const handler = () => handleOpenChange(true);
		window.addEventListener(OPEN_EVENT, handler);
		return () => window.removeEventListener(OPEN_EVENT, handler);
	}, [handleOpenChange]);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 639px)");
		const updateViewport = () => setIsMobile(mediaQuery.matches);

		updateViewport();
		mediaQuery.addEventListener("change", updateViewport);

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			mediaQuery.removeEventListener("change", updateViewport);
		};
	}, []);

	const loadResults = useCallback((trimmed: string) => {
		const cachedResults = cachedResultsRef.current.get(trimmed);

		if (cachedResults) {
			return Promise.resolve(cachedResults);
		}

		const inFlightRequest = inFlightRequestsRef.current.get(trimmed);

		if (inFlightRequest) {
			return inFlightRequest;
		}

		const nextRequest = searchAction(trimmed)
			.then((data) => {
				cachedResultsRef.current.set(trimmed, data);
				return data;
			})
			.finally(() => {
				inFlightRequestsRef.current.delete(trimmed);
			});

		inFlightRequestsRef.current.set(trimmed, nextRequest);
		return nextRequest;
	}, []);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setQuery(value);

		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		const trimmed = value.trim();
		if (trimmed.length < 2) {
			requestIdRef.current += 1;
			setResults({ traders: [], markets: [], builders: [] });
			return;
		}

		timeoutRef.current = setTimeout(() => {
			const requestId = requestIdRef.current + 1;
			requestIdRef.current = requestId;

			startTransition(async () => {
				try {
					const data = await loadResults(trimmed);

					if (requestId !== requestIdRef.current) {
						return;
					}

					setResults(data);
					posthog.capture("search_performed", {
						query: trimmed,
						trader_count: data.traders.length,
						market_count: data.markets.length,
						builder_count: data.builders.length,
						has_results:
							data.traders.length > 0 ||
							data.markets.length > 0 ||
							data.builders.length > 0,
					});
				} catch {
					if (requestId !== requestIdRef.current) {
						return;
					}

					setResults({ traders: [], markets: [], builders: [] });
				}
			});
		}, DEBOUNCE_MS);
	}, [loadResults]);

	const handleResultClick = useCallback(
		(type: "market" | "trader" | "builder", target: string) => {
			posthog.capture("search_result_clicked", { query: query.trim(), type, target });
			handleOpenChange(false);
		},
		[query, handleOpenChange],
	);

	const builderCode = normalizeBuilderCodeQuery(query);
	const apiBuilderCodes = new Set(results.builders.map((b) => b.builder_code.toLowerCase()));
	const showBuilderCodeShortcut = builderCode != null && !apiBuilderCodes.has(builderCode.toLowerCase());
	const hasResults =
		showBuilderCodeShortcut ||
		results.builders.length > 0 ||
		results.traders.length > 0 ||
		results.markets.length > 0;

	const content = (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col">
			<div className="flex min-w-0 items-center border-b px-3">
				{isPending ? (
					<LoaderIcon className="size-4 shrink-0 animate-spin opacity-50" />
				) : (
					<SearchIcon className="size-4 shrink-0 opacity-50" />
				)}
				<Input
					value={query}
					onChange={handleChange}
					placeholder="Search markets, builders, or traders..."
					className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent! shadow-none focus-visible:border-transparent focus-visible:ring-0"
					autoFocus
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={false}
				/>
			</div>
			<div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-h-[min(70svh,22rem)]">
				{query.trim().length >= 2 && !isPending && !hasResults && (
					<p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
				)}
				{(showBuilderCodeShortcut || results.builders.length > 0) && (
					<div>
						<div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
							<BlocksIcon className="size-3.5 text-muted-foreground" />
							<span className="text-xs font-medium text-muted-foreground">Builders</span>
						</div>
						{showBuilderCodeShortcut && builderCode && (
							<SearchRow
								href={`/builders/${encodeURIComponent(builderCode)}` as Route}
								onSelect={() => handleResultClick("builder", builderCode)}
								fallback={<BlocksIcon className="size-4" />}
								title={formatBuilderCodeDisplay(builderCode)}
								meta={<span className="truncate font-mono text-[11px]">{builderCode}</span>}
							/>
						)}
						{results.builders.map((builder) => {
							const title = builder.name?.trim() || formatBuilderCodeDisplay(builder.builder_code);
							const fallback = title.slice(0, 2).toUpperCase();
							return (
								<SearchRow
									key={builder.builder_code}
									href={`/builders/${encodeURIComponent(builder.builder_code)}` as Route}
									onSelect={() => handleResultClick("builder", builder.builder_code)}
									imageUrl={builder.icon_url}
									fallback={fallback}
									title={title}
									meta={<BuilderMeta builder={builder} />}
								/>
							);
						})}
					</div>
				)}
				{results.markets.length > 0 && (
					<div>
						<div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
							<BarChart3Icon className="size-3.5 text-muted-foreground" />
							<span className="text-xs font-medium text-muted-foreground">Markets</span>
						</div>
						{results.markets.map((market) => (
							<SearchRow
								key={market.slug}
								href={`/markets/${market.slug}` as Route}
								onSelect={() => handleResultClick("market", market.slug)}
								imageUrl={market.image_url}
								fallback={<BarChart3Icon className="size-4" />}
								title={market.question ?? market.slug}
								meta={<MarketMeta market={market} />}
							/>
						))}
					</div>
				)}
				{results.traders.length > 0 && (
					<div>
						<div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
							<UserIcon className="size-3.5 text-muted-foreground" />
							<span className="text-xs font-medium text-muted-foreground">Traders</span>
						</div>
						{results.traders.map((trader) => {
							const displayLabel = getTraderDisplayName(trader);
							const traderHref = `/traders/${normalizeWalletAddress(trader.address) ?? trader.address}` as Route;

							return (
								<SearchRow
									key={trader.address}
									href={traderHref}
									onSelect={() => handleResultClick("trader", trader.address)}
									imageUrl={trader.profile_image}
									fallback={displayLabel.slice(0, 2).toUpperCase()}
									title={displayLabel}
									meta={<TraderMeta trader={trader} />}
								/>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<>
			<button
				type="button"
				onClick={() => handleOpenChange(true)}
				className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border bg-card/50 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:h-9 sm:w-auto px-3"
				aria-label="Search"
			>
				<SearchIcon className="size-4 sm:size-3.5" />
				<span className="">Search...</span>
				<kbd className="pointer-events-none ml-1 hidden h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
					⌘K
				</kbd>
			</button>
			{isMobile ? (
				<Sheet open={open} onOpenChange={handleOpenChange}>
					<SheetContent
						side="bottom"
						showCloseButton={false}
						className="min-h-[40vh] max-h-[95vh] gap-0 overflow-hidden rounded-t-2xl border-x border-t p-0 pb-[env(safe-area-inset-bottom)]"
					>
						<SheetTitle className="sr-only">Search</SheetTitle>
						<div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" />
						{content}
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={open} onOpenChange={handleOpenChange}>
					<DialogContent
						showCloseButton={false}
						className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
					>
						<DialogTitle className="sr-only">Search</DialogTitle>
						{content}
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
