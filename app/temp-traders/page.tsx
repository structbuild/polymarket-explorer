import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { truncateAddress } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Temp Traders",
	robots: {
		index: false,
		follow: false,
	},
};

const TRADER_ADDRESSES = [
	"0x91eee6b7cea1916214daebec3b92b7513079c5b8",
	"0x5236aa9b6b041bb6c43e38d96425041122a6e97e",
	"0x4322f785dfa13834ecbf8e1f462eeab9044aeade",
	"0x9cd48c408c72c1c90de480f5d78552a5458050d1",
	"0x1de39f5a4b1313b99fd5278036b2964cc03ca1fa",
	"0x4fc4a330273291fa2a989a64f3692db10cc81f41",
	"0xe4e10e64c2748b5cceb6c75b5802e6306250be40",
	"0xb55fa1296e6ec55d0ce53d93b9237389f11764d4",
	"0xce25e214d5cfe4f459cf67f08df581885aae7fdc",
	"0x482d8a1828a481f8a53cb7ffbbf962ea4d07ba5e",
	"0x717c29f49717fe88563ec619486c507e132c83ad",
	"0x3ad69d08ee5aae305cbabc87a1a1bd4c0fcfa8d9",
	"0xa2cd4ccda9a1f95949df7a3355c4c2daa0642ba0",
	"0x437961a3b2684a4835da753e894d4b5cffdb2e16",
	"0xa14bf68614d94e49236f0f86eeb026f04ebe05e4",
	"0x692861c49902bac6d53851db5cf8900532ca06fc",
	"0x7f7b87578fb5625d0ef3d5521ffb3abb7b9568f3",
	"0x86595a5b8edd61dafff2d0b5c3f6aad30c869552",
	"0xa47536db0f74d557ccab60b535d56713f8cbbfe7",
	"0x3ef70be398c60540e51e51b7aa2da61cf7f4b7bb",
	"0x9ae3a3e57919c4f0c66e4eec5f1f4475d4f76380",
	"0xa012e12645cbba5d03320b1d5ec20c5ef0a26e3e",
	"0xf8bd1c8b749fa65bcd5d0dde4e23b5e45d071d63",
	"0xf784f3ad9514a0f76160dd60f7159d74c9f23e50",
	"0xce1ee0c8de79ed12902869b67afcddb5456f851f",
	"0x989261409f3d510d79cf4097a94d556cf0e8511d",
	"0xa8dbe793ab574c2c58b93bff2eceeb29c5ec4336",
	"0x058f48b0fe2901214215aa53edf2ead7505c4883",
	"0x4640ec44be2a74e2bb60d14e87c0c61b48f8ac33",
	"0x30d576e61a7a55e31bb4e8743d1565943239a0d7",
	"0xb343e89e38ed0c788e974eede1530cf6d9c7a1a1",
	"0x52b91496d6a9f01a0c795df584b7293d00e15138",
	"0xc7a63e87c4e7e6505a24128e88901adee1d4c454",
	"0x4b8f5644e14cb679dbadb5f703f6bf39f180de20",
	"0x684c105a47494e91377e03c474d9e5641af393df",
	"0x6918ea182d963b1fb7888860b8a8b8bcfba5782b",
	"0xc39319fc46cb229eeacf3763cce5977766b3b18f",
	"0xae4286dbf5a0cf63196752e5bea34fcc62480f11",
	"0xcd4d8f2594b7fadb3c3ea7fe803c2e7b75ae3b32",
	"0x3a740beefadc8cb4218af7b6239a2f181d1e5ea7",
	"0x8c5b51860c7633f7a38d383187ee7193a8a69fdf",
	"0x441ef939a4026da6ce4b8c2f31fbeae599f3cd6c",
	"0x9ac570df0cdf6951945498c234d89e095aacbb92",
	"0x06ad7dd031b762945e38438344d33034dc20322d",
	"0x029684724301c24be5df81a50af3d3ec816a1389",
	"0x98efd6e2e8b064ec816766cce9fd2d532b447a68",
	"0x3b841341389abe16969583d4093c8b4f5441f076",
	"0x5ec414d9686e58d17220b571bf455810feb61251",
	"0xc6c171d10fd6a197263b30da5dde4abb113a9dc5",
	"0x7a5a803b04607c6dbc793a3dde3c8a3d9c846c02",
	"0xea1a8fbff6061431e66c72f8d3cf7fc193b6cf7a",
	"0x4c1db2aff90e5094f458e5a12cfd626584a24c70",
	"0x686158d182c450593460487e62bcfd096e30a565",
	"0xb3b3dcf3e418298202240c3dae27489a924966ad",
	"0x357deb9f594c21d133b221d680afb2b83d8245cc",
	"0x748f333631253d363b1e200ddff1f3a45c2d98a8",
	"0xacc3efc81cec2eadd715f6761e560aa964a29a57",
	"0x5d7ce669f4ded782449bda77781ff3e392215c33",
	"0xd7cf77cdfc2b62a81ad065d28aa22eaef3d1ace4",
	"0x5966db1fe50763c9e3c014d756369bad07e1f804",
	"0x041207ee16f8ad41968ea734c3f88baa9628e1b2",
	"0xcae342860e203ed5fa2c9200941e52a5d319d8a8",
	"0x092f5a537703e559e4c93ef9b64a08cb8a170cbf",
	"0x30df0ee90ad040dbaff5441a6be7d999a16a28a9",
	"0xe96667eecca0d26546375456f77db8b3eb13b78c",
	"0xa113d92c8bdd65c4f7e47a086a24ae3b125c284e",
	"0xf2c0a9fd5fa22ac533b5cb38ef15a693eb0fc865",
	"0x0f57f596334f4aea4a6139d311c6cd6f36fc4dd7",
	"0x9e0f6d5430007c41c9e4e0697b62694b22ddd637",
	"0x94330584f251dbc667570a8bea6f7e60f6d9c24c",
	"0xc81134638b47080c92694a853524997ff68f61fb",
	"0x44904a7b60fd25b8b91226b724c2915075c388d5",
	"0x84b1faef830dca39c18354e1ca7b94b5b9ad7739",
	"0x9ac833e9cf85bb662cd4a0cfe3b3b4df7222d27c",
	"0xaeb1b30a06c0fb5b6550700a49b891cc41cd4af3",
	"0x0fdacc8b2c6aa677333f9bb382cffc490133f43e",
	"0x7a5237f9682d8ce14cd5cc70e2e3cdeef7c5f9c5",
	"0x63aa7a478073a4359a1a13bbc9716b75bcfb7ae2",
	"0x043daea87f38ce78d5ddb4f0bd6bfb221613245b",
	"0xa5f4ba17df487a6af4c23bf75740a9aa6ae06b13",
	"0x9ede3f46a79fa3f5396e93365b6cdf25201e208b",
	"0x78bd02ad8d8076959fcec3c51e972e3eb556e7c6",
	"0x9ccda92c5e35612d25e054874a82ac81276cf650",
	"0xb260e94a0f5796d94141420eca9cc4d020b2bf05",
	"0x93310f71781272d9f67993361f8b0cc424a61852",
	"0x585573c366ff2abc24f39dc116cda3cba6e0c6d4",
	"0x122b8d9c52fe14e3af97aee5f5a1698c4f699885",
	"0x19df91c3976589a3c569d53d1bc9a61c060b5e3a",
	"0xdddc61eb02b9a2517719bf034e9e6057d62f1034",
	"0xaeaaa8a36c05e58a08cfa961db587c715d8d0a13",
	"0xc0941b0a4f304488a1260cc093db5ce231a5cba7",
	"0x09194ead658e3b215a217e091cc860c12a3980e9",
	"0x05ef854f9253ab2d4f5ab8280604d92e824d238d",
	"0x45ba4fc0fff74108754af0aeac8f60dc8c7b355d",
	"0x043cee19813900e1a7a6a1b56e7c3469733767a0",
	"0xca2749331334570a414b827b3e58509050828ad5",
	"0x52a6705a15c7b02bc0d3644b19fe94f7b4515d01",
	"0x136eb4a85f37e1baa4b509aef4cdd71e68237d12",
	"0x54b4c8b0056a2e864849197dc31fc65d822c054c",
	"0x73a5d5a0f5d9c9771430defa6e9cc2173585fe29",
] as const;

export default function TempTradersPage() {
	return (
		<main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
			<div className="mb-6">
				<h1 className="text-xl font-medium tracking-tight">Temp Traders</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{TRADER_ADDRESSES.length} whitelisted trader links.
				</p>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-16">#</TableHead>
						<TableHead>Address</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{TRADER_ADDRESSES.map((address, index) => (
						<TableRow key={address}>
							<TableCell className="text-muted-foreground tabular-nums">
								{index + 1}
							</TableCell>
							<TableCell>
								<Link
									href={`/traders/${address}` as Route}
									prefetch={false}
									className="font-mono text-sm text-foreground underline-offset-4 hover:underline"
									title={address}
								>
									<span className="hidden sm:inline">{address}</span>
									<span className="sm:hidden">{truncateAddress(address)}</span>
								</Link>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</main>
	);
}
