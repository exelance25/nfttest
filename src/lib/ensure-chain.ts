import { getChainId, switchChain } from "@wagmi/core";
import { type NftChainId, wagmiConfig } from "@/lib/wagmi";

const CHAIN_SWITCH_MS = 100;
const CHAIN_SWITCH_ATTEMPTS = 30;

/** Cuzdani hedef aga gecir; mint oncesi Base / Monad icin gerekli. */
export async function ensureChain(chainId: NftChainId, chainName: string) {
  if (getChainId(wagmiConfig) === chainId) return;

  await switchChain(wagmiConfig, { chainId });

  for (let i = 0; i < CHAIN_SWITCH_ATTEMPTS; i++) {
    if (getChainId(wagmiConfig) === chainId) return;
    await new Promise((resolve) => setTimeout(resolve, CHAIN_SWITCH_MS));
  }

  throw new Error(`${chainName} agina gecilemedi. Cuzdanda agi onaylayin veya Base Sepolia ekleyin.`);
}
