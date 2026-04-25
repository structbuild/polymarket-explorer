"use client"

import { TraderAvatar } from "@/components/trader/trader-avatar"
import { StructLogo } from "@/components/ui/svgs/struct-logo"
import { truncateAddress } from "@/lib/utils"

type ShareIdentityHeaderProps = {
	address: string
	displayName: string
	profileImage?: string | null
}

export function ShareIdentityHeader({ address, displayName, profileImage }: ShareIdentityHeaderProps) {
	return (
		<div className="mb-5 hidden items-center gap-3 border-b border-border/70 pb-4 group-data-[share-mode=image]/share-card:flex">
			<TraderAvatar
				className="size-10"
				displayName={displayName}
				profileImage={profileImage}
				rounded="md"
			/>
			<div className="min-w-0">
				<p className="truncate text-sm font-medium text-foreground">{displayName}</p>
				<p className="font-mono text-xs text-muted-foreground">{truncateAddress(address, 6)}</p>
			</div>
			<p className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
				Powered by <StructLogo className="h-3 text-foreground" />
			</p>
		</div>
	)
}
