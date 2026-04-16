"use client";

import { openSearchDialog } from "@/components/search/search-dialog";
import { SearchIcon } from "lucide-react";

export function HomeSearchTrigger() {
	return (
		<button
			type="button"
			onClick={() => openSearchDialog()}
			className="relative flex h-9 w-full items-center gap-2 rounded-lg border bg-card/85 pl-3 pr-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			aria-label="Search traders or markets"
		>
			<SearchIcon className="size-3.5 opacity-70" />
			<span className="flex-1 truncate">Search traders or markets...</span>
			<kbd className="pointer-events-none hidden h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
				⌘K
			</kbd>
		</button>
	);
}
