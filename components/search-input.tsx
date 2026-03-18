"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export function SearchInput() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [value, setValue] = useState(searchParams.get("q") ?? "");
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const pushQuery = useCallback(
		(query: string) => {
			const trimmed = query.trim();
			if (trimmed.length >= 2) {
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
		<div className="relative h-12">
			<Input
				value={value}
				onChange={handleChange}
				className="backdrop-blur-sm h-full w-full border bg-card rounded-xl pl-5 pr-14 py-4 text-base! focus-visible:ring-0 focus-visible:ring-offset-0"
				placeholder="Search traders..."
			/>
			<Button type="button" onClick={() => pushQuery(value)} className="size-10! absolute right-1 top-1/2 -translate-y-1/2 rounded-xl">
				<SearchIcon className="size-4" />
			</Button>
		</div>
	);
}
