import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCapitalizeWords } from "@/lib/format";
import { getEventTagFrequencies } from "@/lib/struct/queries/events";

export async function EventTagsScroller() {
	const ranked = await getEventTagFrequencies();

	if (ranked.length === 0) return null;

	return (
		<nav
			aria-label="Browse events by tag"
			className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
		>
			<ul className="flex w-max gap-2">
				{ranked.map((tag) => (
					<li key={tag.slug}>
						<Link
							href={`/tags/${tag.slug}` as Route}
							prefetch={false}
							className="block"
						>
							<Badge
								variant="secondary"
								className="h-8 px-3 text-sm transition-colors hover:bg-muted"
							>
								{formatCapitalizeWords(tag.label)}
							</Badge>
						</Link>
					</li>
				))}
			</ul>
		</nav>
	);
}
