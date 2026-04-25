import type { ReactNode } from "react";
import type { UserProfile } from "@structbuild/sdk";
import { ExternalLinkIcon } from "lucide-react";

import { truncateAddress } from "@/lib/utils";

type TraderInfoProps = {
	address: string;
	profile: UserProfile | null;
};

function InfoStat({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs leading-4 text-muted-foreground">{label}</p>
			<div className="min-w-0 truncate text-sm font-medium sm:text-base">{children}</div>
		</div>
	);
}

function Muted() {
	return <span className="text-muted-foreground">—</span>;
}

export function TraderInfo({ address, profile }: TraderInfoProps) {
	return (
		<div className="rounded-lg bg-card p-4 sm:p-6">
			<p className="mb-4 text-sm text-foreground sm:text-base">Trader Information</p>
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
				<InfoStat label="Address">
					<span className="font-mono">{truncateAddress(address, 4)}</span>
				</InfoStat>
				<InfoStat label="Username">{profile?.name ?? <Muted />}</InfoStat>
				<InfoStat label="Pseudonym">{profile?.pseudonym ?? <Muted />}</InfoStat>
				<InfoStat label="X (Twitter)">
					{profile?.x_username ? (
						<a
							href={`https://x.com/${profile.x_username}`}
							rel="noreferrer"
							target="_blank"
							className="inline-flex items-center gap-1 hover:underline"
						>
							{profile.x_username}
							<ExternalLinkIcon className="size-3.5" />
						</a>
					) : (
						<Muted />
					)}
				</InfoStat>
				<InfoStat label="Verified">{profile ? (profile.verified_badge ? "Yes" : "No") : <Muted />}</InfoStat>
				<InfoStat label="Creator">{profile ? (profile.is_creator ? "Yes" : "No") : <Muted />}</InfoStat>
				<InfoStat label="Moderator">{profile ? (profile.is_mod ? "Yes" : "No") : <Muted />}</InfoStat>
			</div>
			{profile?.bio ? (
				<div className="mt-6 space-y-1">
					<p className="text-xs leading-4 text-muted-foreground">Bio</p>
					<p className="text-sm break-words sm:text-base">{profile.bio}</p>
				</div>
			) : null}
		</div>
	);
}
