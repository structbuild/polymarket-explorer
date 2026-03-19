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
			<div className="flex items-center gap-2 justify-between">
				<p className="text-base text-foreground/90">{label}</p>
				{value !== undefined ? <p className="text-base font-medium">{value}</p> : children}
			</div>
			{separator && <Separator className="my-2" />}
		</>
	);
}
