"use client";

import { searchTradersAction } from "@/app/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getTraderDisplayName, isWalletAddress } from "@/lib/utils";
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
	const [isPending, startTransition] = useTransition();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useHotkey("Mod+K", (event) => {
		event.preventDefault();
		setOpen((prev) => !prev);
	});

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-2 rounded-lg border bg-card/50 px-3 h-8 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
			>
				<SearchIcon className="size-3.5" />
				<span>Search traders...</span>
				<kbd className="pointer-events-none ml-2 inline-flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
					⌘K
				</kbd>
			</button>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent
					showCloseButton={false}
					className="top-[20%] translate-y-0 sm:max-w-lg p-0 gap-0 overflow-hidden"
				>
					<DialogTitle className="sr-only">Search traders</DialogTitle>
					<div className="flex items-center border-b px-3">
						{isPending ? (
							<LoaderIcon className="size-4 shrink-0 opacity-50 animate-spin" />
						) : (
							<SearchIcon className="size-4 shrink-0 opacity-50" />
						)}
						<Input
							value={query}
							onChange={handleChange}
							placeholder="Search by name or paste an address..."
							className="bg-transparent! h-11 border-0 focus-visible:ring-0 focus-visible:border-transparent shadow-none rounded-none"
							autoFocus
						/>
					</div>
					<div className="max-h-72 overflow-y-auto">
						{query.trim().length >= 2 && !isPending && results.length === 0 && (
							<p className="py-6 text-center text-sm text-muted-foreground">No traders found.</p>
						)}
						{isWalletAddress(query.trim()) && (
							<Link
								href={`/trader/${query.trim()}`}
								onClick={() => handleOpenChange(false)}
								className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
							>
								<Avatar size="sm">
									<AvatarFallback>{query.trim().slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div className="flex flex-col min-w-0">
									<span className="text-sm font-medium truncate">{query.trim()}</span>
									<span className="text-xs text-muted-foreground">Go to trader profile</span>
								</div>
							</Link>
						)}
						{results.map((trader) => (
							<Link
								key={trader.address}
								href={`/trader/${trader.address}`}
								onClick={() => handleOpenChange(false)}
								className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
							>
								<Avatar size="sm">
									{trader.profile_image && <AvatarImage src={trader.profile_image} />}
									<AvatarFallback>{getTraderDisplayName(trader).slice(0, 2).toUpperCase()}</AvatarFallback>
								</Avatar>
								<span className="text-sm truncate">{getTraderDisplayName(trader)}</span>
							</Link>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
