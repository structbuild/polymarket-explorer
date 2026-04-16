"use client";

import { searchAction, type SearchResult } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatNumber } from "@/lib/format";
import { getTraderDisplayName, normalizeWalletAddress } from "@/lib/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { BarChart3Icon, LoaderIcon, SearchIcon, UserIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

const DEBOUNCE_MS = 300;
const OPEN_EVENT = "search-dialog:open";

export function openSearchDialog() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(OPEN_EVENT));
	}
}

export function SearchDialog() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult>({ traders: [], markets: [] });
	const [isMobile, setIsMobile] = useState(false);
	const [isPending, startTransition] = useTransition();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const requestIdRef = useRef(0);
	const cachedResultsRef = useRef(new Map<string, SearchResult>());
	const inFlightRequestsRef = useRef(new Map<string, Promise<SearchResult>>());

	useHotkey("Mod+K", (event) => {
		event.preventDefault();
		setOpen((prev) => !prev);
	});

	useEffect(() => {
		const handler = () => setOpen(true);
		window.addEventListener(OPEN_EVENT, handler);
		return () => window.removeEventListener(OPEN_EVENT, handler);
	}, []);

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

	const handleOpenChange = useCallback((nextOpen: boolean) => {
		requestIdRef.current += 1;
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
			setResults({ traders: [], markets: [] });
		}
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
			setResults({ traders: [], markets: [] });
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
				} catch {
					if (requestId !== requestIdRef.current) {
						return;
					}

					setResults({ traders: [], markets: [] });
				}
			});
		}, DEBOUNCE_MS);
	}, [loadResults]);

	const hasResults = results.traders.length > 0 || results.markets.length > 0;

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
					placeholder="Search traders or markets..."
					className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent! shadow-none focus-visible:border-transparent focus-visible:ring-0"
					autoFocus
				/>
			</div>
			<div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-h-[min(70svh,22rem)]">
				{query.trim().length >= 2 && !isPending && !hasResults && (
					<p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
				)}
				{results.markets.length > 0 && (
					<div>
						<div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
							<BarChart3Icon className="size-3.5 text-muted-foreground" />
							<span className="text-xs font-medium text-muted-foreground">Markets</span>
						</div>
						{results.markets.map((market) => (
							<Link
								key={market.slug}
								href={`/markets/${market.slug}` as Route}
								onClick={() => handleOpenChange(false)}
								className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
							>
								<Avatar size="sm">
									{market.image_url && <AvatarImage src={market.image_url} />}
									<AvatarFallback>
										<BarChart3Icon className="size-3.5" />
									</AvatarFallback>
								</Avatar>
								<span className="min-w-0 flex-1 truncate text-sm" title={market.question ?? market.slug}>
									{market.question ?? market.slug}
								</span>
								{market.volume_usd != null && market.volume_usd > 0 && (
									<span className="shrink-0 text-xs text-muted-foreground">
										{formatNumber(market.volume_usd, { compact: true, currency: true })}
									</span>
								)}
							</Link>
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
								<Link
									key={trader.address}
									href={traderHref}
									onClick={() => handleOpenChange(false)}
									className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
								>
									<Avatar size="sm">
										{trader.profile_image && <AvatarImage src={trader.profile_image} />}
										<AvatarFallback>{displayLabel.slice(0, 2).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span className="min-w-0 flex-1 truncate text-sm" title={displayLabel}>
										{displayLabel}
									</span>
								</Link>
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
				onClick={() => setOpen(true)}
				className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-card/50 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-3"
				aria-label="Search"
			>
				<SearchIcon className="size-3.5" />
				<span className="sm:hidden">Search</span>
				<span className="hidden sm:inline">Search...</span>
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
