"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { PlusIcon, XIcon } from "lucide-react";
import type { BuilderTimeframe } from "@structbuild/sdk";

import { searchAction, type SearchResult } from "@/app/actions";
import { BuilderAvatar } from "@/components/builders/builder-avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { builderCompareSearchParamParsers } from "@/lib/builder-compare-search-params";
import { MAX_COMPARE_BUILDERS } from "@/lib/builder-compare-search-params-shared";
import {
	BUILDER_TIMEFRAME_LABELS,
	BUILDER_TIMEFRAME_OPTIONS,
} from "@/lib/struct/builder-shared";

const DEBOUNCE_MS = 250;

export type CompareSelectedBuilder = {
	code: string;
	displayName: string;
	iconUrl: string | null;
	color: string;
};

type BuilderComparePickerProps = {
	codes: string[];
	selected: CompareSelectedBuilder[];
	timeframe: BuilderTimeframe;
	defaultBuilders: SearchResult["builders"];
};

export function BuilderComparePicker({
	codes,
	selected,
	timeframe,
	defaultBuilders,
}: BuilderComparePickerProps) {
	const [, setParams] = useQueryStates(builderCompareSearchParamParsers, {
		shallow: false,
	});
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult["builders"]>([]);
	const [isSearching, startSearch] = useTransition();

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);
	const cacheRef = useRef<Map<string, SearchResult["builders"]>>(new Map());

	const atMax = codes.length >= MAX_COMPARE_BUILDERS;

	const runSearch = useCallback((value: string) => {
		const trimmed = value.trim();
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (trimmed.length < 2) {
			requestIdRef.current += 1;
			setResults([]);
			return;
		}
		const cached = cacheRef.current.get(trimmed);
		if (cached) {
			requestIdRef.current += 1;
			setResults(cached);
			return;
		}
		debounceRef.current = setTimeout(() => {
			const requestId = requestIdRef.current + 1;
			requestIdRef.current = requestId;
			startSearch(async () => {
				try {
					const data = await searchAction(trimmed);
					cacheRef.current.set(trimmed, data.builders);
					if (requestId === requestIdRef.current) setResults(data.builders);
				} catch {
					if (requestId === requestIdRef.current) setResults([]);
				}
			});
		}, DEBOUNCE_MS);
	}, []);

	const addCode = (code: string) => {
		const next = code.trim().toLowerCase();
		if (!next || codes.includes(next) || atMax) return;
		setParams({ codes: [...codes, next] });
		setQuery("");
		setResults([]);
		setOpen(false);
	};

	const removeCode = (code: string) => {
		setParams({ codes: codes.filter((c) => c !== code) });
	};

	const isSearchActive = query.trim().length >= 2;
	const excludeSelected = (builder: SearchResult["builders"][number]) =>
		!codes.includes(builder.builder_code.trim().toLowerCase());
	const visibleResults = (isSearchActive ? results : defaultBuilders).filter(excludeSelected);

	const selectedCodes = new Set(selected.map((builder) => builder.code));
	const unresolvedCodes = codes.filter((code) => !selectedCodes.has(code));

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-wrap items-center gap-2">
				{selected.map((builder) => (
					<span
						key={builder.code}
						className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card py-1 pr-1 pl-2 text-sm"
					>
						<span
							className="size-2 shrink-0 rounded-full"
							style={{ backgroundColor: builder.color }}
							aria-hidden
						/>
						<BuilderAvatar
							builderCode={builder.code}
							iconUrl={builder.iconUrl}
							alt={`${builder.displayName} icon`}
							className="size-5!"
						/>
						<span className="max-w-[10rem] truncate" title={builder.displayName}>
							{builder.displayName}
						</span>
						<button
							type="button"
							onClick={() => removeCode(builder.code)}
							className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							aria-label={`Remove ${builder.displayName}`}
						>
							<XIcon className="size-3.5" />
						</button>
					</span>
				))}

				{unresolvedCodes.map((code) => (
					<span
						key={code}
						title="Builder not found"
						className="inline-flex items-center gap-2 rounded-full border border-dashed border-border bg-muted/40 py-1 pr-1 pl-2.5 text-sm text-muted-foreground"
					>
						<span className="max-w-[10rem] truncate font-mono text-xs">{code}</span>
						<button
							type="button"
							onClick={() => removeCode(code)}
							className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-muted hover:text-foreground"
							aria-label={`Remove ${code}`}
						>
							<XIcon className="size-3.5" />
						</button>
					</span>
				))}

				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger
						disabled={atMax}
						render={
							<Button variant="outline" size="sm" className="gap-1.5">
								<PlusIcon className="size-4" />
								Add builder
							</Button>
						}
					/>
					<PopoverContent align="start" className="w-72 p-0">
						<Command shouldFilter={false}>
							<CommandInput
								placeholder="Search builders…"
								value={query}
								onValueChange={(value) => {
									setQuery(value);
									runSearch(value);
								}}
							/>
							<CommandList>
								{visibleResults.length === 0 ? (
									<CommandEmpty>
										{isSearchActive
											? isSearching
												? "Searching…"
												: "No builders found."
											: "No builders available."}
									</CommandEmpty>
								) : null}
								{visibleResults.length > 0 ? (
									<CommandGroup heading={isSearchActive ? undefined : "Top builders"}>
										{visibleResults.map((builder) => (
											<CommandItem
												key={builder.builder_code}
												value={builder.builder_code}
												onSelect={() => addCode(builder.builder_code)}
												className="gap-2"
											>
												<BuilderAvatar
													builderCode={builder.builder_code}
													iconUrl={builder.icon_url}
													className="size-6!"
												/>
												<span className="min-w-0 truncate">
													{builder.name ?? builder.builder_code}
												</span>
											</CommandItem>
										))}
									</CommandGroup>
								) : null}
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>

				{atMax ? (
					<span className="text-xs text-muted-foreground">
						Max {MAX_COMPARE_BUILDERS} builders.
					</span>
				) : null}
			</div>

			<ToggleGroup
				aria-label="Compare timeframe"
				value={[timeframe]}
				onValueChange={(next) => {
					const picked = next[0];
					if (picked && picked !== timeframe) {
						setParams({ timeframe: picked as BuilderTimeframe });
					}
				}}
				variant="outline"
				size="sm"
				className="h-8 w-fit"
			>
				{BUILDER_TIMEFRAME_OPTIONS.map((option) => (
					<ToggleGroupItem key={option} value={option}>
						{BUILDER_TIMEFRAME_LABELS[option]}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</div>
	);
}
