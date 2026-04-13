import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MarketChart, MarketChartFallback } from "@/components/market/market-chart";
import { MarketHeader } from "@/components/market/market-header";
import { MarketHolders, MarketHoldersFallback } from "@/components/market/market-holders";
import { MarketOutcomes } from "@/components/market/market-outcomes";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { formatNumber } from "@/lib/format";
import { getMarketBySlug } from "@/lib/struct/market-queries";
import {
	buildEntityPageTitle,
	buildPageMetadata,
} from "@/lib/site-metadata";
import type { MarketResponse } from "@structbuild/sdk";

export const revalidate = 300;

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		return {};
	}

	const yesOutcome = market.outcomes?.find(
		(o) => o.name.toLowerCase() === "yes",
	);
	const probability = yesOutcome?.price
		? (yesOutcome.price * 100).toFixed(0)
		: "N/A";
	const volume = formatNumber(market.volume_usd ?? 0, {
		compact: true,
		currency: true,
	});
	const holders = formatNumber(market.total_holders ?? 0, { decimals: 0 });
	const marketName = market.question ?? market.title ?? "Prediction Market";
	const leadingOutcome = yesOutcome?.name ?? market.outcomes?.[0]?.name ?? "Leading outcome";
	const oddsSummary =
		probability === "N/A"
			? "Current odds are unavailable"
			: `${leadingOutcome} trades at ${probability}%`;

	return buildPageMetadata({
		title: buildEntityPageTitle(marketName, "Odds & Volume"),
		description: `Track live Polymarket odds for ${marketName}. ${oddsSummary}, ${volume} in volume, and ${holders} holders.`,
		canonical: `/markets/${slug}`,
		openGraph: {
			type: "article",
			images: [
				{
					url: `/markets/${slug}/opengraph-image`,
					width: 1200,
					height: 630,
				},
			],
		},
		twitter: {
			images: [`/markets/${slug}/opengraph-image`],
		},
	});
}

function truncateQuestion(question: string, maxLength: number = 60) {
	if (question.length <= maxLength) return question;
	return `${question.slice(0, maxLength)}…`;
}

function buildFaqJsonLd(market: MarketResponse) {
	const topOutcome = market.outcomes?.reduce(
		(best, o) =>
			(o.price ?? 0) > (best.price ?? 0) ? o : best,
		market.outcomes![0],
	);

	const probability = topOutcome?.price
		? (topOutcome.price * 100).toFixed(0)
		: "N/A";
	const volume = formatNumber(market.volume_usd ?? 0, {
		compact: true,
		currency: true,
	});
	const date = new Date().toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});

	return {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: market.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: `As of ${date}, Polymarket traders predict ${topOutcome?.name ?? "the leading outcome"} at ${probability}% probability. Total trading volume: ${volume}. ${market.description ?? ""}`,
				},
			},
		],
	};
}

export default async function MarketPage({ params }: Props) {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		notFound();
	}

	const breadcrumbTag =
		market.tags?.length ? market.tags[0] : null;

	const outcomes = market.outcomes?.map((o) => ({
		label: o.name,
		probability: o.price,
	})) ?? [];

	console.log(market);

	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-4 px-4 pb-10 sm:gap-6 sm:px-6 sm:pb-12">
				<Breadcrumbs
					items={[
						{ label: "Home", href: "/" },
						{ label: "Markets", href: "/markets" },
						...(breadcrumbTag
							? [{ label: breadcrumbTag, href: `/tags/${breadcrumbTag}` as string }]
							: []),
						{
							label: truncateQuestion(market.question ?? market.title ?? slug),
							href: `/markets/${slug}`,
						},
					]}
				/>

				<JsonLd data={buildFaqJsonLd(market)} />

				<MarketHeader market={market} slug={slug} />

				{outcomes.length > 0 && (
					<MarketOutcomes outcomes={outcomes} />
				)}

				{market.condition_id ? (
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
							<div className="min-w-0 lg:flex-1">
								<Suspense fallback={<MarketChartFallback />}>
									<MarketChart conditionId={market.condition_id} />
								</Suspense>
							</div>
							<div className="min-w-0 lg:w-[340px] lg:shrink-0">
								<Suspense fallback={<MarketHoldersFallback />}>
									<MarketHolders slug={slug} />
								</Suspense>
							</div>
						</div>
					) : (
						<Suspense fallback={<MarketHoldersFallback />}>
							<MarketHolders slug={slug} />
						</Suspense>
					)}
			</div>
		</div>
	);
}
