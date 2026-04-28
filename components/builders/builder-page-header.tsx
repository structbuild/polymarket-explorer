import type { BuilderMetadata } from "@structbuild/sdk";
import { ExternalLinkIcon } from "lucide-react";

import { BuilderAvatar } from "@/components/builders/builder-avatar";
import { CopyAddress } from "@/components/trader/copy-address";
import { Button } from "@/components/ui/button";
import { getBuilderDisplayName } from "@/lib/builder-open-graph";
import { formatBuilderCodeDisplay } from "@/lib/utils";

const BUILDER_METADATA_CONTACT_HREF = "https://x.com/structbuild";

type BuilderPageHeaderProps = {
	builderCode: string;
	metadata: BuilderMetadata | null;
};

function resolveWebsiteUrl(raw: string) {
	const t = raw.trim();
	if (!t) return null;
	if (/^https?:\/\//i.test(t)) return t;
	return `https://${t}`;
}

function resolveTwitterUrl(raw: string) {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	const handle = trimmed.replace(/^@/, "");
	if (!handle) return null;
	return `https://x.com/${handle}`;
}

export function BuilderPageHeader({ builderCode, metadata }: BuilderPageHeaderProps) {
	const codeLabel = formatBuilderCodeDisplay(builderCode);
	const displayName = getBuilderDisplayName(builderCode, metadata);
	const description = metadata?.description?.trim();
	const websiteUrl = metadata?.website ? resolveWebsiteUrl(metadata.website) : null;
	const twitterUrl = metadata?.twitter ? resolveTwitterUrl(metadata.twitter) : null;
	const showContactCta = metadata === null;

	return (
		<div className="flex min-w-0 w-full flex-col gap-4 overflow-hidden lg:flex-row lg:items-center lg:justify-between">
			<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
				<BuilderAvatar
					builderCode={builderCode}
					iconUrl={metadata?.icon_url}
					alt={`${displayName} icon`}
					className="size-16! sm:size-24!"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
					<div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
						<h1 className="min-w-0 truncate text-2xl font-medium" title={displayName}>
							{displayName}
						</h1>
						<CopyAddress
							address={builderCode}
							eventName="builder_code_copied"
							displayText={codeLabel}
						/>
					</div>
					{description ? (
						<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
					) : null}
					{showContactCta ? (
						<p className="max-w-2xl text-sm text-muted-foreground">
							This builder has no public listing yet. Reach out if you represent this builder and want
							to add a name, icon, and links.
						</p>
					) : null}
				</div>
			</div>

			{showContactCta || websiteUrl || twitterUrl ? (
				<div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 lg:items-end">
					{showContactCta ? (
						<Button
							className="w-full sm:w-fit"
							size="lg"
							nativeButton={false}
							render={
								<a
									href={BUILDER_METADATA_CONTACT_HREF}
									rel="noopener noreferrer"
									target="_blank"
								/>
							}
						>
							Contact us
							<ExternalLinkIcon />
						</Button>
					) : (
						<div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
							{websiteUrl ? (
								<Button
									className="w-full sm:w-fit"
									size="lg"
									variant="secondary"
									nativeButton={false}
									render={
										<a href={websiteUrl} rel="noopener noreferrer" target="_blank" />
									}
								>
									Website
									<ExternalLinkIcon />
								</Button>
							) : null}
							{twitterUrl ? (
								<Button
									className="w-full sm:w-fit"
									size="lg"
									variant="secondary"
									nativeButton={false}
									render={
										<a href={twitterUrl} rel="noopener noreferrer" target="_blank" />
									}
								>
									X (Twitter)
									<ExternalLinkIcon />
								</Button>
							) : null}
						</div>
					)}
				</div>
			) : null}
		</div>
	);
}
