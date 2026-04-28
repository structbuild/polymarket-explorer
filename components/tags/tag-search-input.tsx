"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LISTING_PATH = "/tags";

export function TagSearchInput({ query }: { query: string }) {
	return <TagSearchInputField key={query} query={query} />;
}

function TagSearchInputField({ query }: { query: string }) {
	const router = useRouter();
	const [value, setValue] = useState(query);
	const [isPending, startTransition] = useTransition();
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastCommittedRef = useRef(query);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	function commit(next: string) {
		const current = new URLSearchParams(window.location.search);
		const params = new URLSearchParams(current.toString());
		const trimmed = next.trim();
		if (next !== trimmed) {
			setValue(trimmed);
		}
		if (trimmed) {
			params.set("q", trimmed);
		} else {
			params.delete("q");
		}
		lastCommittedRef.current = trimmed;
		const nextQs = params.toString();
		if (nextQs === current.toString()) return;
		const href = (nextQs ? `${LISTING_PATH}?${nextQs}` : LISTING_PATH) as Route;
		startTransition(() => {
			router.replace(href, { scroll: false });
		});
	}

	function handleChange(next: string) {
		setValue(next);
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => commit(next), 250);
	}

	function handleClear() {
		if (timerRef.current) clearTimeout(timerRef.current);
		setValue("");
		commit("");
	}

	return (
		<div className={cn("relative w-56", isPending && "opacity-70")}>
			<SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				value={value}
				onChange={(event) => handleChange(event.target.value)}
				placeholder="Search tags"
				aria-label="Search tags"
				className="h-8 pl-8 pr-8"
			/>
			{value ? (
				<button
					type="button"
					onClick={handleClear}
					aria-label="Clear search"
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					<XIcon className="size-4" />
				</button>
			) : null}
		</div>
	);
}
