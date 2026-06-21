#!/usr/bin/env node
/**
 * akln-nft deploy cüzdan bakiyesi — sadece bu proje.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { defineChain } from "viem";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const map = {};
  for (const name of [".env", ".env.local"]) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 1) continue;
      map[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    }
  }
  return map;
}

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
});

async function main() {
  const env = loadEnv();
  const pk = env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("HATA: DEPLOYER_PRIVATE_KEY yok (.env.local)");
    process.exit(1);
  }

  const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  const monadRpc = env.NEXT_PUBLIC_MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
  const baseRpc = env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com";

  const monadClient = createPublicClient({ chain: monadTestnet, transport: http(monadRpc) });
  const baseClient = createPublicClient({ chain: baseSepolia, transport: http(baseRpc) });

  const [monadBal, baseBal] = await Promise.all([
    monadClient.getBalance({ address: account.address }),
    baseClient.getBalance({ address: account.address }),
  ]);

  console.log("=== akln-nft deploy cuzdani ===");
  console.log("Adres:", account.address);
  console.log("Monad Testnet (MON, gas):", formatEther(monadBal), "MON");
  console.log("Base Sepolia (ETH, gas):", formatEther(baseBal), "ETH");

  const minMonad = 1_000_000_000_000_000n; // 0.001 MON
  const minBase = 50_000_000_000_000n; // 0.00005 ETH

  let ok = true;
  if (monadBal < minMonad) {
    console.log("\nYETERSIZ MON — Monad kontrat deploy icin test MON gerekli (~0.001 MON)");
    console.log("Faucet: https://testnet.monad.xyz/");
    ok = false;
  }
  if (baseBal < minBase) {
    console.log("\nYETERSIZ ETH — Base kontrat deploy icin test ETH gerekli (~0.0001 ETH)");
    console.log("Faucet: https://faucet.zalalena.com/base");
    console.log("veya: npm run fund:base  (CDP API key varsa)");
    ok = false;
  }

  if (!ok) {
    console.log("\nGas gonderdikten sonra tekrar run-deploy.cmd calistirin.");
    process.exit(2);
  }

  console.log("\nBakiye yeterli — deploy devam edebilir.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
