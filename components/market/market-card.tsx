import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { OutcomeBar } from "@/components/market/outcome-bar";
import { formatNumber, formatDateShort } from "@/lib/format";

type MarketCardProps = {
	slug: string | null;
	question: string | null;
	imageUrl: string | null;
	outcomes: { label: string; probability: number | null }[];
	volumeUsd: number | null;
	liquidityUsd: number | null;
	status: string;
	endTime: number | null;
};

function StatusBadge({ status }: { status: string }) {
	const variant = status === "open" ? "positive" : status === "closed" ? "negative" : "secondary";
	return <Badge variant={variant}>{status}</Badge>;
}

function MarketCardContent({
	question,
	imageUrl,
	outcomes,
	volumeUsd,
	liquidityUsd,
	status,
	endTime,
}: Omit<MarketCardProps, "slug">) {
	return (
		<div className="flex gap-4">
			{imageUrl ? (
				<Image
					src={imageUrl}
					alt=""
					width={48}
					height={48}
					className="size-12 shrink-0 rounded-md object-cover"
				/>
			) : (
				<div className="size-12 shrink-0 rounded-md bg-muted" />
			)}
			<div className="min-w-0 flex-1 space-y-3">
				<p className="line-clamp-2 font-medium leading-snug">
					{question ?? "Untitled Market"}
				</p>
				{outcomes.length > 0 && <OutcomeBar outcomes={outcomes} />}
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
					{volumeUsd !== null && (
						<span>Vol {formatNumber(volumeUsd, { compact: true, currency: true })}</span>
					)}
					{liquidityUsd !== null && (
						<span>Liq {formatNumber(liquidityUsd, { compact: true, currency: true })}</span>
					)}
					<StatusBadge status={status} />
					{endTime !== null && <span>Ends {formatDateShort(endTime)}</span>}
				</div>
			</div>
		</div>
	);
}

export function MarketCard({
	slug,
	question,
	imageUrl,
	outcomes,
	volumeUsd,
	liquidityUsd,
	status,
	endTime,
}: MarketCardProps) {
	const content = (
		<MarketCardContent
			question={question}
			imageUrl={imageUrl}
			outcomes={outcomes}
			volumeUsd={volumeUsd}
			liquidityUsd={liquidityUsd}
			status={status}
			endTime={endTime}
		/>
	);

	if (slug) {
		return (
			<Link
				href={`/market/${slug}` as Route}
				className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
			>
				{content}
			</Link>
		);
	}

	return (
		<div className="rounded-lg border bg-card p-4">
			{content}
		</div>
	);
}
