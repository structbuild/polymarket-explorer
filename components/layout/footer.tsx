import Link from "next/link";
import { Suspense } from "react";

import { FooterColumnFallback } from "@/components/layout/footer-column";
import {
	FooterTopMarkets,
	FooterTopRewards,
	FooterTopTags,
	FooterTopTraders,
} from "@/components/layout/footer-data-columns";
import { FooterStructCta } from "@/components/layout/footer-struct-column";
import { Github } from "@/components/ui/svgs/github";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { XLogoIcon } from "../ui/svgs/xtwitter";

export default function Footer() {
	return (
		<footer className="relative z-10 m-1 mt-12 rounded-3xl border bg-muted/20">
			<div className="mx-auto w-full max-w-7xl space-y-12 px-5 py-12 sm:space-y-16 sm:px-8 sm:py-16">
				<div className="flex flex-wrap items-center justify-between gap-4 border-b pb-8">
					<Link
						href="/"
						aria-label="Struct Polymarket Explorer home"
						className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
					>
						<StructLogo className="h-5 text-foreground" />
						<span className="text-sm text-muted-foreground">Polymarket Explorer</span>
					</Link>
					<div className="flex items-center gap-5">
					<Link
							href="https://x.com/structbuild"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Struct on X"
							className="block text-muted-foreground transition-colors hover:text-primary"
						>
							<XLogoIcon className="size-4.5" />
						</Link>
						<Link
							href="https://github.com/structbuild/polymarket-explorer"
							target="_blank"
							rel="noopener noreferrer"
							aria-label="GitHub repository"
							className="block text-muted-foreground transition-colors hover:text-primary"
						>
							<Github className="size-5" />
						</Link>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-8 sm:grid-cols-[1.4fr_0.6fr_0.6fr_1.4fr]">
					<Suspense fallback={<FooterColumnFallback title="Top Markets" />}>
						<FooterTopMarkets />
					</Suspense>
					<Suspense fallback={<FooterColumnFallback title="Top Categories" />}>
						<FooterTopTags />
					</Suspense>
					<Suspense fallback={<FooterColumnFallback title="Top Traders" />}>
						<FooterTopTraders />
					</Suspense>
					<Suspense fallback={<FooterColumnFallback title="Rewards Markets" />}>
						<FooterTopRewards />
					</Suspense>
				</div>

				<FooterStructCta />

				{/* <div className="flex flex-col items-center justify-between gap-2 rounded-md bg-muted/60 p-4 px-6 py-3 text-sm text-muted-foreground sm:flex-row">
					<span>© StructBuild, Inc. · Built on the Struct API</span>
					<Link
						href="https://www.struct.to"
						target="_blank"
						rel="noopener noreferrer"
						className="transition-colors hover:text-primary"
					>
						struct.to
					</Link>
				</div> */}
			</div>
		</footer>
	);
}
