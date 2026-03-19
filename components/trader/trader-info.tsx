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
	return (
		<div className="p-6 rounded-lg bg-card">
			<p className="text-base text-foreground">Trader Information</p>
			<Separator className="my-2" />
			<InfoRow label="Address" value={truncateAddress(address, 12)} />
			<InfoRow label="Username" value={profile?.name} />
			<InfoRow label="Pseudonym" value={profile?.pseudonym ?? 0} />
			<InfoRow label="Verified" value={profile?.verified_badge ? "Yes" : "No"} />
			<InfoRow label="X (Twitter)">
				{profile?.x_username ? (
					<a
						href={`https://x.com/${profile.x_username}`}
						rel="noreferrer"
						target="_blank"
						className="flex items-center gap-1 text-base font-medium hover:underline"
					>
						{profile.x_username}
						<ExternalLinkIcon className="size-4" />
					</a>
				) : (
					<p className="text-base font-medium">-</p>
				)}
			</InfoRow>
			<InfoRow label="Creator" value={profile?.is_creator ? "Yes" : "No"} />
			<InfoRow label="Moderator" value={profile?.is_mod ? "Yes" : "No"} />
			<InfoRow
				label="Created At"
				value={new Date(profile?.created_at ?? 0 * 1000).toLocaleDateString("en-US", {
					year: "numeric",
					month: "long",
					day: "numeric",
				})}
			/>
			<div className="flex flex-col gap-px">
				<p className="text-base text-foreground/90">Bio</p>
				<p className="text-base">{profile?.bio || "No bio"}</p>
			</div>
			<Separator className="my-2" />
		</div>
	);
}
