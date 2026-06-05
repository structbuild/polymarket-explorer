import type { Route } from "next";
import Link from "next/link";

import {
	FooterColumn,
	FooterColumnLink,
} from "@/components/layout/footer-column";
import { FooterStructCta } from "@/components/layout/footer-struct-column";
import { FooterThemeToggle } from "@/components/layout/footer-theme-toggle";
import { Github } from "@/components/ui/svgs/github";
import { StructLogo } from "@/components/ui/svgs/struct-logo";
import { XLogoIcon } from "../ui/svgs/xtwitter";

export default function Footer() {
	return (
		<footer className="relative z-10 m-1 mt-12 rounded-3xl border bg-muted/20">
			<div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
				<FooterStructCta />

				<div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-[1fr_1.85fr] lg:gap-16">
					<div className="flex flex-col gap-5">
						<Link
							href="/"
							prefetch={false}
							aria-label="Struct Polymarket Explorer home"
							className="inline-flex w-fit items-center gap-2.5 transition-opacity hover:opacity-80"
						>
							<StructLogo className="h-5 text-foreground" />
							<span className="text-sm text-muted-foreground">Polymarket Explorer</span>
						</Link>
						<p className="max-w-xs text-sm text-muted-foreground">
							An open explorer for Polymarket markets, traders, and on-chain activity — powered by the Struct data
							API.
						</p>
						<div className="flex items-center gap-2">
							<Link
								href="https://x.com/structbuild"
								prefetch={false}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Struct on X"
								className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-primary"
							>
								<XLogoIcon className="size-4" />
							</Link>
							<Link
								href="https://github.com/structbuild/polymarket-explorer"
								prefetch={false}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="GitHub repository"
								className="inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-muted hover:text-primary"
							>
								<Github className="size-4.5" />
							</Link>
						</div>
					</div>

					<FooterColumns />
				</div>

				<div className="mt-12 flex flex-col gap-4 border-t pt-8 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-xs text-muted-foreground">
						Built by Struct. Not affiliated with Polymarket.
					</p>
					<FooterThemeToggle />
				</div>
			</div>
		</footer>
	);
}

function FooterColumns() {
	return (
		<div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
			<FooterColumn title="Markets">
				<FooterColumnLink href={"/markets" as Route}>All markets</FooterColumnLink>
				<FooterColumnLink href={"/events" as Route}>Events</FooterColumnLink>
				<FooterColumnLink href={"/rewards" as Route}>Rewards markets</FooterColumnLink>
				<FooterColumnLink href={"/analytics" as Route}>Market analytics</FooterColumnLink>
			</FooterColumn>
			<FooterColumn title="Categories">
				<FooterColumnLink href={"/tags" as Route}>All categories</FooterColumnLink>
				<FooterColumnLink href={"/tags/politics" as Route}>Politics</FooterColumnLink>
				<FooterColumnLink href={"/tags/crypto" as Route}>Crypto</FooterColumnLink>
				<FooterColumnLink href={"/tags/sports" as Route}>Sports</FooterColumnLink>
			</FooterColumn>
			<FooterColumn title="Explore">
				<FooterColumnLink href={"/traders" as Route}>Traders</FooterColumnLink>
				<FooterColumnLink href={"/builders" as Route}>Builders</FooterColumnLink>
				<FooterColumnLink href={"/leaderboard" as Route}>Leaderboard</FooterColumnLink>
				<FooterColumnLink href={"/analytics" as Route}>Analytics</FooterColumnLink>
			</FooterColumn>
			<FooterColumn title="Developer">
				<FooterColumnLink href="https://www.struct.to/rest-api" external>
					REST API
				</FooterColumnLink>
				<FooterColumnLink href="https://docs.struct.to/" external>
					Documentation
				</FooterColumnLink>
				<FooterColumnLink href="https://github.com/structbuild/polymarket-explorer" external>
					GitHub
				</FooterColumnLink>
				<FooterColumnLink href="https://x.com/structbuild" external>
					Updates
				</FooterColumnLink>
			</FooterColumn>
		</div>
	);
}
