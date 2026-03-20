import { InfoRow } from "@/components/trader/info-row";
import { Separator } from "@/components/ui/separator";
import { truncateAddress } from "@/lib/utils";
import type { UserProfile } from "@structbuild/sdk";
import { ExternalLinkIcon } from "lucide-react";

type TraderInfoProps = {
	address: string;
	profile: UserProfile | null;
};

export function TraderInfo({ address, profile }: TraderInfoProps) {
	const createdAtTimestamp = profile?.created_at != null ? Number(profile.created_at) : null;
	const createdAt =
		createdAtTimestamp != null && Number.isFinite(createdAtTimestamp)
			? new Date(createdAtTimestamp * 1000).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				})
			: "-";

	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<p className="text-sm text-foreground sm:text-base">Trader Information</p>
			<Separator className="my-2" />
			<InfoRow label="Address" value={<span className="font-mono text-xs sm:text-sm">{truncateAddress(address, 4)}</span>} />
			<InfoRow label="Username" value={profile?.name ?? "-"} />
			<InfoRow label="Pseudonym" value={profile?.pseudonym ?? "-"} />
			<InfoRow label="Verified" value={profile?.verified_badge ? "Yes" : "No"} />
			<InfoRow label="X (Twitter)">
				{profile?.x_username ? (
					<a
						href={`https://x.com/${profile.x_username}`}
						rel="noreferrer"
						target="_blank"
						className="flex items-center gap-1 break-all text-sm font-medium hover:underline sm:justify-end sm:text-base"
					>
						{profile.x_username}
						<ExternalLinkIcon className="size-4" />
					</a>
				) : (
					<p className="text-sm font-medium sm:text-base">-</p>
				)}
			</InfoRow>
			<InfoRow label="Creator" value={profile?.is_creator ? "Yes" : "No"} />
			<InfoRow label="Moderator" value={profile?.is_mod ? "Yes" : "No"} />
			<InfoRow label="Created At" value={createdAt} />
			<div className="flex flex-col gap-px">
				<p className="text-sm text-foreground/90 sm:text-base">Bio</p>
				<p className="text-sm break-words sm:text-base">{profile?.bio || "No bio"}</p>
			</div>
			<Separator className="my-2" />
		</div>
	);
}
