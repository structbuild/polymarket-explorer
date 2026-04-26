"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isWalletAddress, normalizeWalletAddress } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import posthog from "posthog-js";

const DEBOUNCE_MS = 300;

export function SearchInput({ compact }: { compact?: boolean } = {}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [value, setValue] = useState(searchParams.get("q") ?? "");
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const pushQuery = useCallback(
		(query: string) => {
			const trimmed = query.trim();

			if (isWalletAddress(trimmed)) {
				posthog.capture("trader_address_searched", { query: trimmed });
				router.push(`/traders/${normalizeWalletAddress(trimmed) ?? trimmed}` as Route);
				return;
			}

			if (trimmed.length >= 2) {
				posthog.capture("search_submitted", { query: trimmed });
				router.replace(`/?q=${encodeURIComponent(trimmed)}`);
			} else if (trimmed.length === 0) {
				router.replace("/");
			}
		},
		[router],
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value;
		setValue(next);

		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => pushQuery(next), DEBOUNCE_MS);
	};

	return (
		<div className={compact ? "relative h-9" : "relative h-12"}>
			<Input
				value={value}
				onChange={handleChange}
				className={
					compact
						? "h-full w-full rounded-lg border bg-card/85 py-1.5 pl-3 pr-9 text-sm! focus-visible:ring-0 focus-visible:ring-offset-0"
						: "h-full w-full rounded-xl border bg-card/85 py-4 pl-4 pr-12 text-sm! backdrop-blur-sm focus-visible:ring-0 focus-visible:ring-offset-0 sm:pl-5 sm:pr-14 sm:text-base!"
				}
				placeholder="Search traders or markets..."
			/>
			<Button
				type="button"
				onClick={() => pushQuery(value)}
				className={
					compact
						? "absolute right-0.5 top-1/2 size-8! -translate-y-1/2 rounded-lg"
						: "absolute right-1 top-1/2 size-10! -translate-y-1/2 rounded-xl"
				}
				size={compact ? "icon-sm" : "icon"}
				aria-label="Search"
			>
				<SearchIcon className={compact ? "size-3.5" : "size-4"} />
			</Button>
		</div>
	);
}
