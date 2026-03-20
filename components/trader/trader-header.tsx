import { CopyAddress } from "@/components/trader/copy-address";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";

type StatItemProps = {
	label: string;
	value: React.ReactNode;
};

function StatItem({ label, value }: StatItemProps) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs leading-4 text-muted-foreground sm:text-sm">{label}</p>
			<p className="text-base font-medium break-words sm:text-lg">{value}</p>
		</div>
	);
}

type TraderHeaderProps = {
	address: string;
	displayName: string;
	profileImage?: string | null;
	firstTradeAt?: number | null;
	totalBuys?: number | null;
	totalSells?: number | null;
	totalVolumeUsd?: number | null;
};

export function TraderHeader({
	address,
	displayName,
	profileImage,
	firstTradeAt,
	totalBuys,
	totalSells,
	totalVolumeUsd,
}: TraderHeaderProps) {
	const activeSince = firstTradeAt
		? new Date(firstTradeAt * 1000).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Unknown";

	return (
		<div className="flex flex-col gap-4 rounded-lg bg-card p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
				<Avatar size="xl" className="size-16! rounded-lg after:rounded-lg sm:size-20!">
					<AvatarImage src={profileImage ?? ""} className="rounded-lg" />
					<AvatarFallback className="rounded-lg text-lg">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-col gap-4">
					<div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
						<h1 className="text-2xl font-medium break-words sm:text-3xl">{displayName}</h1>
						<CopyAddress address={address} />
					</div>
					<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4">
						<StatItem label="Active Since" value={activeSince} />
						<StatItem label="Buys" value={totalBuys ?? 0} />
						<StatItem label="Sells" value={totalSells ?? 0} />
						<StatItem label="Volume" value={formatNumber(totalVolumeUsd ?? 0, { compact: true, currency: true })} />
					</div>
				</div>
			</div>

			<div className="flex w-full items-center justify-stretch gap-2 lg:w-auto lg:justify-end">
				<Button
					className="w-full sm:w-fit"
					size="lg"
					nativeButton={false}
					render={<a href={`https://polymarket.com/${address}`} rel="noreferrer" target="_blank" />}
				>
					View Profile
					<ExternalLinkIcon />
				</Button>
			</div>
		</div>
	);
}
