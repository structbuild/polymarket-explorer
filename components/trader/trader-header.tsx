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
		<div className="space-y-1">
			<p className="text-sm leading-1.5 text-muted-foreground">{label}</p>
			<p className="text-lg font-medium">{value}</p>
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
	const activeSince = new Date((firstTradeAt ?? 0) * 1000).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<div className="p-6 rounded-lg bg-card flex items-center justify-between gap-4">
			<div className="flex items-center gap-6">
				<Avatar size="xl" className="rounded-lg after:rounded-lg size-20!">
					<AvatarImage src={profileImage ?? ""} className="rounded-lg" />
					<AvatarFallback className="rounded-lg text-lg">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
				</Avatar>
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<h1 className="text-2xl font-medium">{displayName}</h1>
						<CopyAddress address={address} />
					</div>
					<div className="flex items-center gap-8">
						<StatItem label="Active Since" value={activeSince} />
						<StatItem label="Buys" value={totalBuys ?? 0} />
						<StatItem label="Sells" value={totalSells ?? 0} />
						<StatItem label="Volume" value={formatNumber(totalVolumeUsd ?? 0, { compact: true, currency: true })} />
					</div>
				</div>
			</div>

			<div className="flex items-center justify-end gap-2">
				<Button
					className="w-fit"
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
