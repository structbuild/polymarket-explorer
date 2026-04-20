import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { MarketResponse } from "@structbuild/sdk";

import { formatCapitalizeWords, formatNumber, slugify } from "@/lib/format";

type RelatedMarketsProps = {
	markets: MarketResponse[];
	tag: string;
	currentSlug: string;
};

export function RelatedMarkets({ markets, tag, currentSlug }: RelatedMarketsProps) {
	const items = markets
		.filter((m) => m.market_slug && m.market_slug !== currentSlug)
		.slice(0, 6);

	if (items.length === 0) return null;

	const tagLabel = formatCapitalizeWords(tag);
	const tagSlug = slugify(tag);

	return (
		<section aria-labelledby="related-markets-heading" className="mt-8">
			<div className="mb-4 flex items-baseline justify-between gap-3">
				<h2 id="related-markets-heading" className="text-lg font-medium tracking-tight">
					More {tagLabel} markets
				</h2>
				<Link
					href={`/tags/${tagSlug}` as Route}
					className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
				>
					View all
				</Link>
			</div>
			<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{items.map((m) => {
					const question = m.question ?? m.title ?? "Untitled market";
					const outcomes = m.outcomes ?? [];
					const leading = outcomes.reduce<(typeof outcomes)[number] | null>(
						(best, o) => (best == null || (o.price ?? 0) > (best.price ?? 0) ? o : best),
						null,
					);
					const probability = leading?.price != null ? `${(leading.price * 100).toFixed(0)}%` : null;
					const volume = formatNumber(m.metrics?.lifetime?.volume ?? m.volume_usd ?? 0, {
						compact: true,
						currency: true,
					});
					const summary = [probability && leading?.name && `${leading.name} ${probability}`, `${volume} volume`]
						.filter(Boolean)
						.join(" · ");

					return (
						<li key={m.condition_id}>
							<Link
								href={`/markets/${m.market_slug}` as Route}
								className="group flex items-start gap-3 rounded-lg bg-card p-4 transition-colors hover:bg-accent"
							>
								{m.image_url ? (
									<Image
										src={m.image_url}
										alt={question}
										width={48}
										height={48}
										className="size-12 shrink-0 rounded-md object-cover"
									/>
								) : (
									<div className="size-12 shrink-0 rounded-md bg-muted" />
								)}
								<div className="min-w-0 flex-1">
									<p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90 group-hover:text-foreground">
										{question}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">{summary}</p>
								</div>
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
