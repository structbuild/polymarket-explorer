import { Separator } from "@/components/ui/separator";

type InfoRowProps = {
	label: string;
	value?: React.ReactNode;
	children?: React.ReactNode;
	separator?: boolean;
};

export function InfoRow({ label, value, children, separator = true }: InfoRowProps) {
	return (
		<>
			<div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
				<p className="text-sm text-foreground/90 sm:text-base">{label}</p>
				{value !== undefined ? (
					<div className="text-sm font-medium break-words sm:text-right sm:text-base">{value}</div>
				) : (
					<div className="min-w-0 text-left sm:text-right">{children}</div>
				)}
			</div>
			{separator && <Separator className="my-2 sm:my-3" />}
		</>
	);
}
