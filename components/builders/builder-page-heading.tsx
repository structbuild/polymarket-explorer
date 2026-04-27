import { CopyAddress } from "@/components/trader/copy-address";
import { formatBuilderCodeDisplay } from "@/lib/utils";

type BuilderPageHeadingProps = {
	builderCode: string;
};

export function BuilderPageHeading({ builderCode }: BuilderPageHeadingProps) {
	const label = formatBuilderCodeDisplay(builderCode);
	return (
		<div className="flex min-w-0 items-center gap-4">
			<h1
				className="min-w-0 truncate font-mono text-2xl font-medium tracking-tight text-foreground"
				title={builderCode}
			>
				{label}
			</h1>
			<CopyAddress address={builderCode} eventName="builder_code_copied" displayText={label} />
		</div>
	);
}
