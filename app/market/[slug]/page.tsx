import type { Route } from "next";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OutcomeBar } from "@/components/market/outcome-bar";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	formatDateShort,
	formatNumber,
	pnlColorClass,
} from "@/lib/format";
import {
	getMarketBySlug,
	getMarketChart,
	getMarketHolders,
} from "@/lib/struct/market-queries";
import { cn, getTraderDisplayName } from "@/lib/utils";
import type {
	MarketResponse,
	PositionChartOutcome,
} from "@structbuild/sdk";

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

	const description = `Current odds: ${yesOutcome?.name ?? market.outcomes?.[0]?.name ?? "Yes"} at ${probability}%. Track real-time predictions, trading volume (${volume}), and ${formatNumber(market.total_holders ?? 0, { decimals: 0 })} holders for this Polymarket market.`;

	return {
		title: market.question ?? undefined,
		description,
		alternates: {
			canonical: `/market/${slug}`,
		},
		openGraph: {
			type: "article",
			title: market.question ?? undefined,
			description,
			images: [
				{
					url: `/market/${slug}/opengraph-image`,
					width: 1200,
					height: 630,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title: market.question ?? undefined,
			description,
		},
	};
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

function StatusBadge({ status }: { status: string }) {
	const variant =
		status === "open"
			? "positive"
			: status === "closed"
				? "secondary"
				: "outline";

	return (
		<Badge variant={variant}>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</Badge>
	);
}

function StatItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-sm font-medium">{value}</span>
		</div>
	);
}

function StatsRow({ market }: { market: MarketResponse }) {
	return (
		<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
			<StatItem
				label="Volume"
				value={formatNumber(market.volume_usd ?? 0, {
					compact: true,
					currency: true,
				})}
			/>
			<StatItem
				label="Liquidity"
				value={formatNumber(market.liquidity_usd ?? 0, {
					compact: true,
					currency: true,
				})}
			/>
			<StatItem
				label="Holders"
				value={formatNumber(market.total_holders ?? 0, { decimals: 0 })}
			/>
			<div className="flex flex-col gap-0.5">
				<span className="text-xs text-muted-foreground">Status</span>
				<StatusBadge status={market.status ?? "unknown"} />
			</div>
			<StatItem
				label="End Date"
				value={formatDateShort(market.end_time)}
			/>
		</div>
	);
}

function buildChartPath(data: { t: number; v: number }[]) {
	if (data.length < 2) return null;

	const width = 700;
	const height = 200;
	const padding = 12;

	const minT = data[0].t;
	const maxT = data[data.length - 1].t;
	const tRange = maxT - minT || 1;

	const values = data.map((d) => d.v);
	const minV = Math.min(...values);
	const maxV = Math.max(...values);
	const vRange = maxV - minV || 0.01;

	const xAt = (t: number) =>
		padding + ((t - minT) / tRange) * (width - padding * 2);
	const yAt = (v: number) =>
		padding + ((maxV - v) / vRange) * (height - padding * 2);

	const sampled =
		data.length > 100
			? data.filter(
					(_, i) =>
						i === 0 ||
						i === data.length - 1 ||
						i % Math.ceil(data.length / 100) === 0,
				)
			: data;

	const linePath = sampled
		.map((point, i) => {
			const cmd = i === 0 ? "M" : "L";
			return `${cmd} ${xAt(point.t).toFixed(2)} ${yAt(point.v).toFixed(2)}`;
		})
		.join(" ");

	const lastX = xAt(sampled[sampled.length - 1].t);
	const firstX = xAt(sampled[0].t);
	const areaPath = `${linePath} L ${lastX.toFixed(2)} ${(height - padding).toFixed(2)} L ${firstX.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

	return { linePath, areaPath, width, height, minV, maxV };
}

function ProbabilityChart({
	chartData,
}: {
	chartData: PositionChartOutcome[];
}) {
	const COLORS = [
		{ stroke: "#10b981", fill: "rgba(16, 185, 129, 0.1)" },
		{ stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.1)" },
		{ stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.1)" },
		{ stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.1)" },
		{ stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.1)" },
	];

	const primaryOutcome = chartData[0];
	if (!primaryOutcome?.data?.length) {
		return (
			<div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
				No chart data available
			</div>
		);
	}

	const chart = buildChartPath(primaryOutcome.data);
	if (!chart) {
		return null;
	}

	return (
		<div className="space-y-3">
			<svg
				viewBox={`0 0 ${chart.width} ${chart.height}`}
				className="h-[200px] w-full"
				preserveAspectRatio="none"
			>
				{chartData.map((outcome, idx) => {
					const paths = buildChartPath(outcome.data);
					if (!paths) return null;
					const color = COLORS[idx % COLORS.length];
					return (
						<g key={outcome.outcome_index}>
							<path d={paths.areaPath} fill={color.fill} />
							<path
								d={paths.linePath}
								fill="none"
								stroke={color.stroke}
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</g>
					);
				})}
			</svg>
			<div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
				{chartData.map((outcome, idx) => {
					const color = COLORS[idx % COLORS.length];
					return (
						<span key={outcome.outcome_index} className="flex items-center gap-1.5">
							<span
								className="inline-block size-2 rounded-full"
								style={{ backgroundColor: color.stroke }}
							/>
							{outcome.name}
						</span>
					);
				})}
			</div>
		</div>
	);
}

async function ChartSection({
	conditionId,
}: {
	conditionId: string;
}) {
	const chartData = await getMarketChart(conditionId);

	if (!chartData?.length) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Probability History</CardTitle>
			</CardHeader>
			<CardContent>
				<ProbabilityChart chartData={chartData} />
			</CardContent>
		</Card>
	);
}

function ChartFallback() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Probability History</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="h-[200px] animate-pulse rounded-md bg-muted" />
			</CardContent>
		</Card>
	);
}

async function HoldersSection({ slug }: { slug: string }) {
	const holders = await getMarketHolders(slug, 10);

	if (!holders?.outcomes?.length) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Top Holders</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{holders.outcomes.map((outcomeGroup) => (
						<div key={outcomeGroup.outcome_index} className="space-y-2">
							<h4 className="text-xs font-medium text-muted-foreground">
								{outcomeGroup.outcome_name}
							</h4>
							<div className="space-y-1.5">
								{outcomeGroup.holders.slice(0, 5).map((holder) => {
									const displayName = getTraderDisplayName(holder.trader);
									const traderHref = `/trader/${holder.trader.address}` as Route;

									return (
										<div
											key={holder.trader.address}
											className="flex items-center justify-between gap-2 text-sm"
										>
											<Link
												href={traderHref}
												className="min-w-0 truncate text-foreground transition-colors hover:text-primary"
											>
												{displayName}
											</Link>
											<div className="flex shrink-0 items-center gap-3 text-xs">
												<span className="text-muted-foreground">
													{holder.shares_usd
														? formatNumber(
																Number(holder.shares_usd),
																{ compact: true, currency: true },
															)
														: `${formatNumber(Number(holder.shares), { compact: true })} shares`}
												</span>
												{holder.pnl?.unrealized_pnl_usd != null && (
													<span
														className={cn(
															"font-medium",
															pnlColorClass(Number(holder.pnl.unrealized_pnl_usd)),
														)}
													>
														{formatNumber(
															Number(holder.pnl.unrealized_pnl_usd),
															{ compact: true, currency: true },
														)}
													</span>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function HoldersFallback() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Top Holders</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{Array.from({ length: 2 }, (_, groupIdx) => (
						<div key={groupIdx} className="space-y-2">
							<div className="h-3 w-12 animate-pulse rounded bg-muted" />
							<div className="space-y-1.5">
								{Array.from({ length: 5 }, (_, idx) => (
									<div
										key={idx}
										className="flex items-center justify-between gap-2"
									>
										<div className="h-4 w-24 animate-pulse rounded bg-muted" />
										<div className="h-4 w-16 animate-pulse rounded bg-muted" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

export default async function MarketPage({ params }: Props) {
	const { slug } = await params;
	const market = await getMarketBySlug(slug);

	if (!market) {
		notFound();
	}

	const breadcrumbTag =
		market.tags?.length ? market.tags[0] : "Market";

	return (
		<div className="flex w-full justify-center">
			<div className="flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 sm:gap-8 sm:px-6 sm:pb-12">
				<Breadcrumbs
					items={[
						{ label: "Home", href: "/" },
						{ label: "Markets", href: "/" },
						{ label: breadcrumbTag, href: "/" },
						{
							label: truncateQuestion(market.question ?? market.title ?? slug),
							href: `/market/${slug}`,
						},
					]}
				/>

				<JsonLd data={buildFaqJsonLd(market)} />

				<div className="space-y-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
						{market.image_url && (
							<Image
								src={market.image_url}
								alt={market.question ?? market.title ?? ""}
								width={80}
								height={80}
								className="shrink-0 rounded-lg"
							/>
						)}
						<div className="min-w-0 flex-1 space-y-2">
							<h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
								{market.question ?? market.title}
							</h1>
							{market.description && (
								<p className="text-sm leading-relaxed text-muted-foreground">
									{market.description}
								</p>
							)}
						</div>
					</div>

					<StatsRow market={market} />

					{(market.outcomes?.length ?? 0) > 0 && (
						<OutcomeBar outcomes={market.outcomes!.map((o) => ({ label: o.name, probability: o.price }))} />
					)}
				</div>

				<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-6">
					<div className="min-w-0 space-y-4 lg:w-2/3">
						{market.condition_id && (
							<Suspense fallback={<ChartFallback />}>
								<ChartSection conditionId={market.condition_id} />
							</Suspense>
						)}
					</div>

					<div className="min-w-0 space-y-4 lg:w-1/3">
						<Suspense fallback={<HoldersFallback />}>
							<HoldersSection slug={slug} />
						</Suspense>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					{market.event_slug && (
						<Link
							href={`/event/${market.event_slug}` as Route}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Part of event: <span className="underline">{market.event_slug}</span>
						</Link>
					)}

					{(market.tags?.length ?? 0) > 0 && (
						<div className="flex flex-wrap gap-2">
							{market.tags!.map((tag) => (
								<Link
									key={tag}
									href={`/tags/${tag}` as Route}
								>
									<Badge variant="secondary">{tag}</Badge>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
