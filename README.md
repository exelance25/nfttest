# AKLN NFT

Minimal standalone test NFT mint UI for **Monad Testnet** (10143) and **Base Sepolia** (84532).

Click an NFT card to connect your wallet and mint. No separate Connect Wallet button — RainbowKit opens on card click.

## Stack

- Next.js 15, React 19, Tailwind CSS
- wagmi v2, viem, RainbowKit, TanStack Query
- Foundry contract: `TestNetworkNFT.sol`

## Quick start

```bash
cd akln-nft
cp .env.example .env.local
# Edit NEXT_PUBLIC_WC_PROJECT_ID and contract addresses
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (port 3000 may be used by other apps).

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL (metadata + deploy) |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect Cloud project ID |
| `NEXT_PUBLIC_MONAD_TESTNET_RPC` | Monad Testnet RPC |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Base Sepolia RPC |
| `NEXT_PUBLIC_MONAD_NFT_ADDRESS` | Monad contract (default in `.env.example`) |
| `NEXT_PUBLIC_BASE_NFT_ADDRESS` | Base contract (deploy first) |
| `DEPLOYER_PRIVATE_KEY` | Server-only — deploy script only |

Treasury (mint payments): `0x1491baEd4db010D8F8B54cED442aF3326ed2c77a`  
Mint price: **0.0001** native token · Max supply: **200**

## Deploy contracts

```bash
# Install Foundry first: https://book.getfoundry.sh/getting-started/installation
npm run deploy              # both networks
npm run deploy -- --base-only   # Base Sepolia only
npm run deploy -- --monad-only  # Monad Testnet only
```

After deploy, copy printed addresses into `.env.local`.

**Base Sepolia — deploy icin test ETH gerekir**

Deployer cüzdanı (`DEPLOYER_PRIVATE_KEY`) Base Sepolia'da ~0.00002 ETH harcar. Bakiye 0 ise:

```bash
npm run fund:base
```

Manuel faucet (captcha):
- [Zalalena Base Sepolia](https://faucet.zalalena.com/base) — ~0.015 ETH
- [ethfaucet.com Base Sepolia](https://ethfaucet.com/networks/base/base-sepolia) — 0.1 ETH/gün

Otomatik: [Coinbase CDP API key](https://portal.cdp.coinbase.com) → `.env.local` içine `CDP_API_KEY_ID` + `CDP_API_KEY_SECRET`.

Deploy sonrasi `NEXT_PUBLIC_BASE_NFT_ADDRESS` otomatik `.env.local`'e yazilir. Vercel'de de ayni adresi env olarak ekleyin.

`NEXT_PUBLIC_SITE_URL` canli URL olmali — `tokenURI` deploy sirasinda `{SITE_URL}/api/nft/metadata/base` olarak sabitlenir.

## Vercel

1. GitHub repo: `exelance25/nfttest` — branch **`main`**.
2. Vercel → Project → **Settings → Environment Variables** (Production):

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://my-wallet-app.vercel.app` (veya Vercel domain'in) |
| `NEXT_PUBLIC_WC_PROJECT_ID` | Reown project ID (public — set in Vercel dashboard) |
| `NEXT_PUBLIC_MONAD_NFT_ADDRESS` | `0xc79Eb92d332E7E719C579405b20fa2908D177b1B` |
| `NEXT_PUBLIC_BASE_NFT_ADDRESS` | `0x0eB83A50981bDcB26C4b471ae4eCe2f87448A127` |
| `NEXT_PUBLIC_MONAD_TESTNET_RPC` | `https://testnet-rpc.monad.xyz` |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | `https://base-sepolia-rpc.publicnode.com` |

3. Reown → [cloud.reown.com](https://cloud.reown.com) → Project → **Allowed Domains**:
   - `https://my-wallet-app.vercel.app`
   - `http://localhost:3001`
4. Copy all vars from `vercel.env.example` into Vercel env settings.
5. **Redeploy** after env changes.

`npx plugins add vercel/vercel-plugin` gerekmez — bu Cursor eklentisi; Vercel deploy GitHub bağlantısı ile olur.

**Not:** Kontratlar `localhost` metadata URI ile deploy edildi. Canlı sitede wallet'ta doğru NFT görseli için `NEXT_PUBLIC_SITE_URL` canlı URL iken `npm run deploy` ile yeniden deploy gerekir.

## Chains

| Network | Chain ID | Native |
|---------|----------|--------|
| Monad Testnet | 10143 | MON |
| Base Sepolia | 84532 | ETH |
