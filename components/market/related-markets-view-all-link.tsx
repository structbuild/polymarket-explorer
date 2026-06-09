"use client";

import Link from "next/link";
import type { Route } from "next";
import posthog from "posthog-js";

type RelatedMarketsViewAllLinkProps = {
	href: Route;
	tag: string;
};

export function RelatedMarketsViewAllLink({ href, tag }: RelatedMarketsViewAllLinkProps) {
	return (
		<Link
			href={href}
			prefetch={false}
			onClick={() => posthog.capture("related_markets_view_all_clicked", { tag })}
			className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
		>
			View all
		</Link>
	);
}
