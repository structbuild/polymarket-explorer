"use client";

import type { Route } from "next";
import Link from "next/link";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/format";

const COLLAPSED_COUNT = 4;
const THRESHOLD = 5;

type MarketTagsProps = {
	tags: string[];
};

export function MarketTags({ tags }: MarketTagsProps) {
	const [expanded, setExpanded] = useState(false);
	const shouldCollapse = tags.length >= THRESHOLD;
	const visibleTags = !shouldCollapse || expanded ? tags : tags.slice(0, COLLAPSED_COUNT);
	const hiddenCount = tags.length - COLLAPSED_COUNT;

	return (
		<div className="flex flex-wrap gap-1.5">
			{visibleTags.map((tag, index) => (
				<Link key={`${tag}-${index}`} href={`/tags/${slugify(tag)}` as Route} prefetch={false}>
					<Badge variant="secondary" className="h-7 px-3 capitalize">
						{tag}
					</Badge>
				</Link>
			))}
			{shouldCollapse && (
				<button
					type="button"
					onClick={() => setExpanded((v) => !v)}
					className="inline-flex h-7 items-center gap-1 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
				>
					{expanded ? <MinusIcon className="size-3" /> : <PlusIcon className="size-3" />}
					{expanded ? "Show less" : `${hiddenCount} more`}
				</button>
			)}
		</div>
	);
}
