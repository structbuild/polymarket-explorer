import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { Volume } from "@/components/ui/volume";
import { RelatedMarketsViewAllLink } from "@/components/market/related-markets-view-all-link";
import { formatCapitalizeWords, slugify } from "@/lib/format";
import type { RelatedMarketItem } from "@/lib/market-related";

type RelatedMarketsProps = {
	markets: RelatedMarketItem[];
	tag: string;
};

export function RelatedMarkets({ markets, tag }: RelatedMarketsProps) {
	if (markets.length === 0) return null;

	const tagLabel = formatCapitalizeWords(tag);
	const tagSlug = slugify(tag);

	return (
		<section aria-labelledby="related-markets-heading" className="mt-8">
			<div className="mb-4 flex items-baseline justify-between gap-3">
				<h2 id="related-markets-heading" className="text-lg font-medium tracking-tight">
					More {tagLabel} markets
				</h2>
				<RelatedMarketsViewAllLink href={`/tags/${tagSlug}` as Route} tag={tag} />
			</div>
			<ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{markets.map((market) => {
					const lead =
						market.probability && market.leadingOutcome
							? `${market.leadingOutcome} ${market.probability}`
							: null;

					return (
						<li key={market.conditionId}>
							<Link
								href={`/markets/${market.slug}` as Route}
								prefetch={false}
								className="group flex items-start gap-3 rounded-lg bg-card p-4 transition-colors hover:bg-accent"
							>
								{market.imageUrl ? (
									<Image
										src={market.imageUrl}
										alt={market.question}
										width={48}
										height={48}
										className="size-12 shrink-0 rounded-md object-cover"
									/>
								) : (
									<div className="size-12 shrink-0 rounded-md bg-muted" />
								)}
								<div className="min-w-0 flex-1">
									<p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/90 group-hover:text-foreground">
										{market.question}
									</p>
									<p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
										{lead ? (
											<>
												<span>{lead}</span>
												<span aria-hidden="true">·</span>
											</>
										) : null}
										<Volume usd={market.volumeUsd} shares={market.sharesVolume} compact />
										<span>volume</span>
									</p>
								</div>
							</Link>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
