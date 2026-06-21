import { NextRequest, NextResponse } from "next/server";

type Collection = "monad" | "base";

const COLLECTION_META: Record<
  Collection,
  { name: string; description: string; imagePath: string; externalUrl: string; network: string; symbol: string }
> = {
  monad: {
    name: "NFT Monad",
    description: "NFT — Monad Testnet. Odeme: 0.0001 ETH (WETH).",
    imagePath: "/nft/monad/image.svg",
    externalUrl: "https://testnet.monadvision.com",
    network: "Monad Testnet",
    symbol: "NFT-M",
  },
  base: {
    name: "NFT Base",
    description: "NFT — Base Sepolia. Odeme: 0.0001 ETH.",
    imagePath: "/nft/base/image.svg",
    externalUrl: "https://sepolia.basescan.org",
    network: "Base Sepolia",
    symbol: "NFT-B",
  },
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ collection: string }> },
) {
  const { collection: raw } = await context.params;
  if (raw !== "monad" && raw !== "base") {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const collection = raw as Collection;
  const meta = COLLECTION_META[collection];
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    request.nextUrl.origin;

  return NextResponse.json({
    name: meta.name,
    description: meta.description,
    image: `${origin}${meta.imagePath}`,
    external_url: meta.externalUrl,
    attributes: [
      { trait_type: "Collection", value: "NFT" },
      { trait_type: "Network", value: meta.network },
      { trait_type: "Symbol", value: meta.symbol },
      { trait_type: "Payment", value: "ETH" },
      { trait_type: "Max Supply", value: "200" },
    ],
  });
}
