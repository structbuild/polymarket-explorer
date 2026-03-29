"use client";

import { searchTradersAction } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getTraderDisplayName } from "@/lib/utils";
import { useHotkey } from "@tanstack/react-hotkeys";
import { LoaderIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

type TraderResult = {
	address: string;
	name: string | null;
	pseudonym: string | null;
	profile_image: string | null;
};

const DEBOUNCE_MS = 300;

export function SearchDialog() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<TraderResult[]>([]);
	const [isMobile, setIsMobile] = useState(false);
	const [isPending, startTransition] = useTransition();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useHotkey("Mod+K", (event) => {
		event.preventDefault();
		setOpen((prev) => !prev);
	});

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
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
			setResults([]);
		}
	}, []);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setQuery(value);

		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		const trimmed = value.trim();
		if (trimmed.length < 2) {
			setResults([]);
			return;
		}

		timeoutRef.current = setTimeout(() => {
			startTransition(async () => {
				const data = await searchTradersAction(trimmed);
				setResults(data);
			});
		}, DEBOUNCE_MS);
	}, []);

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
					placeholder="Search by name or paste an address..."
					className="h-11 min-w-0 flex-1 rounded-none border-0 bg-transparent! shadow-none focus-visible:border-transparent focus-visible:ring-0"
					autoFocus
				/>
			</div>
			<div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain sm:max-h-[min(70svh,22rem)]">
				{query.trim().length >= 2 && !isPending && results.length === 0 && (
					<p className="py-6 text-center text-sm text-muted-foreground">No traders found.</p>
				)}
				{results.map((trader) => {
					const displayLabel = getTraderDisplayName(trader);
					return (
						<Link
							key={trader.address}
							href={`/trader/${trader.address}`}
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
		</div>
	);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-card/50 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:px-3"
				aria-label="Search traders"
			>
				<SearchIcon className="size-3.5" />
				<span className="sm:hidden">Search</span>
				<span className="hidden sm:inline">Search traders...</span>
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
						<SheetTitle className="sr-only">Search traders</SheetTitle>
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
						<DialogTitle className="sr-only">Search traders</DialogTitle>
						{content}
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
