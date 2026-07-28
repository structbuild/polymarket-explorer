import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ComboDetailHeader, buildComboTitle } from "@/components/combos/combo-detail-header";
import { ComboMetrics, ComboMetricsFallback } from "@/components/combos/combo-metrics";
import { ComboPriceChart, ComboPriceChartFallback } from "@/components/combos/combo-price-chart";
import { normalizeComboResolution } from "@/components/combos/combo-resolution";
import { AnchorSectionNav } from "@/components/layout/anchor-section-nav";
import { SectionAnchor } from "@/components/layout/section-anchor";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ComboLegsList } from "@/components/ui/combo";
import { normalizeComboLegs } from "@/lib/combo";
import { getSiteUrl } from "@/lib/env";
import { formatNumber } from "@/lib/format";
import { buildEntityPageTitle, buildPageMetadata } from "@/lib/site-metadata";
import { getComboMarketByConditionId } from "@/lib/struct/queries/combos";
import { truncateMarketTitle } from "@/lib/utils";

const COMBO_NAV_ITEMS = [
	{ id: "combo-overview", label: "Overview" },
	{ id: "combo-chart", label: "Chart" },
	{ id: "combo-metrics", label: "Metrics" },
];

type Props = {
	params: Promise<{ conditionId: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { conditionId } = await params;
	const combo = await getComboMarketByConditionId(conditionId);

	if (!combo) {
		return {};
	}

	const title = buildComboTitle(combo);
	const legCount = combo.leg_count ?? combo.legs.length;
	const impliedYes = combo.implied_probability_yes;
	const impliedYesLabel = impliedYes != null ? `${(impliedYes * 100).toFixed(0)}%` : null;
	const volume = formatNumber(combo.usd_volume ?? 0, { compact: true, currency: true });

	const descriptor = impliedYesLabel ? `${impliedYesLabel} · Polymarket Combo` : "Polymarket Combo";
	const descriptionParts = [`${legCount}-leg parlay`];
	if (impliedYesLabel) {
		descriptionParts.push(`${impliedYesLabel} implied odds`);
	}
	descriptionParts.push(`${volume} volume`);
	const description = `${descriptionParts.join(" · ")}. Live Polymarket combo market details.`;

	return buildPageMetadata({
		title: buildEntityPageTitle(title, descriptor),
		description,
		canonical: `/combos/${conditionId}`,
	});
}

export default async function ComboDetailPage({ params, searchParams }: Props) {
	await connection();

	const { conditionId } = await params;
	const resolvedSearchParams = (await searchParams) ?? {};
	const resolution = normalizeComboResolution(resolvedSearchParams.resolution);
	const combo = await getComboMarketByConditionId(conditionId);

	if (!combo) {
		notFound();
	}

	const title = buildComboTitle(combo);
	const legs = normalizeComboLegs(combo.legs);
	const comboUrl = new URL(`/combos/${conditionId}`, getSiteUrl()).toString();
	const comboJsonLd: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		name: title,
		url: comboUrl,
	};

	return (
		<>
			<AnchorSectionNav items={COMBO_NAV_ITEMS} />
			<div className="flex w-full justify-center">
				<div className="flex w-full max-w-7xl flex-col gap-4 px-4 pt-4 pb-10 sm:gap-6 sm:px-6 sm:pt-6 sm:pb-12">
					<Breadcrumbs
						items={[
							{ label: "Home", href: "/" },
							{ label: "Combos", href: "/combos" },
							{ label: truncateMarketTitle(title), href: `/combos/${conditionId}` },
						]}
					/>

					<JsonLd data={comboJsonLd} />

					<SectionAnchor id="combo-overview">
						<ComboDetailHeader combo={combo} />
					</SectionAnchor>

					<SectionAnchor id="combo-chart">
						<div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
							<div className="lg:col-span-2">
								<Suspense key={resolution} fallback={<ComboPriceChartFallback />}>
									<ComboPriceChart conditionId={conditionId} resolution={resolution} comboLegs={legs} />
								</Suspense>
							</div>
							<section className="bg-card rounded-lg p-4 sm:p-6">
								<h2 className="mb-4 text-sm font-medium text-muted-foreground">Legs</h2>
								<ComboLegsList legs={legs} />
							</section>
						</div>
					</SectionAnchor>

					<SectionAnchor id="combo-metrics">
						<Suspense fallback={<ComboMetricsFallback />}>
							<ComboMetrics conditionId={conditionId} />
						</Suspense>
					</SectionAnchor>
				</div>
			</div>
		</>
	);
}
