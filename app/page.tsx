import { BeamsBackground } from "@/components/background/beams-background";
import { TopTraders, TopTradersFallback } from "@/components/home/top-traders";
import { SearchInput } from "@/components/search/search-input";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchTraders } from "@/lib/struct/queries";
import { getTraderDisplayName, isWalletAddress, normalizeWalletAddress } from "@/lib/utils";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

type Props = {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
	const qValue = (await searchParams).q;
	const q = Array.isArray(qValue) ? qValue[0] : qValue;
	const hasQuery = (q?.trim().length ?? 0) >= 2;

	return {
		title: "Polymarket Explorer — Analyze Any Trader",
		description:
			"Search and analyze any Polymarket trader by username or wallet address. View PnL charts, trading history, and performance metrics. Powered by Struct.",
		alternates: {
			canonical: "/",
		},
		robots: hasQuery
			? {
					index: false,
					follow: true,
				}
			: {
					index: true,
					follow: true,
				},
	};
}

export default async function HomePage({ searchParams }: Props) {
	const qValue = (await searchParams).q;
	const q = Array.isArray(qValue) ? qValue[0] : qValue;
	const query = q?.trim() ?? "";

	if (isWalletAddress(query)) {
		redirect(`/trader/${normalizeWalletAddress(query) ?? query}`);
	}

	const hasQuery = query.length >= 2;

	const traders = hasQuery ? (await searchTraders(query)).slice(0, 10) : [];

	return (
		<div className="relative flex flex-1 flex-col px-4 py-10 sm:px-6 sm:py-16">
			<div className="mx-auto w-full max-w-7xl">
				<Breadcrumbs items={[{ label: "Home", href: "/" }]} />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center">
				<BeamsBackground />
				<div className="w-full max-w-xl">
				<div className="mb-8 space-y-2 text-center sm:mb-10">
					<h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Analyze any trader</h1>
					<p className="mx-auto max-w-md text-sm text-muted-foreground sm:text-base">Enter a trader&apos;s address or username to get started</p>
				</div>
				<SearchInput />
				<div className="mt-4 flex w-full flex-col items-center">
					{hasQuery ? (
						<div className="flex w-full flex-wrap justify-center gap-2">
							{traders.map((trader) => {
								const traderHref = `/trader/${normalizeWalletAddress(trader.address) ?? trader.address}` as Route;

								return (
									<Link
										key={trader.address}
										href={traderHref}
										className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-xs text-foreground/90 opacity-80 backdrop-blur-sm transition-colors hover:bg-accent hover:opacity-100 sm:h-9 sm:gap-2 sm:px-3 sm:text-sm"
									>
										{trader.profile_image && (
											<Avatar size="xs">
												<AvatarImage src={trader.profile_image} />
												<AvatarFallback>{getTraderDisplayName(trader).slice(0, 2).toUpperCase()}</AvatarFallback>
											</Avatar>
										)}
										<span className="max-w-44 truncate sm:max-w-[16rem]">{getTraderDisplayName(trader)}</span>
									</Link>
								);
							})}
							{traders.length === 0 && (
								<p className="text-center text-sm text-muted-foreground">No traders found for &ldquo;{query}&rdquo;</p>
							)}
						</div>
					) : (
						<Suspense fallback={<TopTradersFallback />}>
							<TopTraders />
						</Suspense>
					)}
				</div>
				</div>
			</div>
		</div>
	);
}
