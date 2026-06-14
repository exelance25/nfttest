#!/usr/bin/env node
/**
 * Base Sepolia deploy cüzdanına test ETH almaya çalışır, sonra deploy eder.
 *
 * Manuel (en kolay):
 *   https://faucet.zalalena.com/base  — captcha, ~0.015 ETH
 *   https://ethfaucet.com/networks/base/base-sepolia — BringID doğrulama
 *
 * Otomatik (ücretsiz CDP API key):
 *   https://portal.cdp.coinbase.com → API Keys
 *   .env.local: CDP_API_KEY_ID, CDP_API_KEY_SECRET
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.env.NODE_OPTIONS = process.env.NODE_OPTIONS ?? "--use-system-ca";

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

async function tryCdpFaucet(address, env) {
  const id = env.CDP_API_KEY_ID;
  const secret = env.CDP_API_KEY_SECRET;
  if (!id || !secret) return false;

  try {
    process.env.CDP_API_KEY_ID = id;
    process.env.CDP_API_KEY_SECRET = secret;
    const { CdpClient } = await import("@coinbase/cdp-sdk");
    const cdp = new CdpClient();
    const res = await cdp.evm.requestFaucet({
      address,
      network: "base-sepolia",
      token: "eth",
    });
    console.log("CDP faucet tx:", res.transactionHash ?? res);
    return true;
  } catch (err) {
    console.warn("CDP faucet basarisiz:", err instanceof Error ? err.message : err);
    return false;
  }
}

async function waitForBalance(client, address, minWei, seconds) {
  const steps = Math.ceil(seconds / 5);
  for (let i = 0; i < steps; i++) {
    const balance = await client.getBalance({ address });
    if (balance >= minWei) return balance;
    if (i < steps - 1) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  return client.getBalance({ address });
}

async function main() {
  const env = loadEnv();
  const pk = env.DEPLOYER_PRIVATE_KEY;
  if (!pk) {
    console.error("DEPLOYER_PRIVATE_KEY eksik — akln-nft/.env.local");
    process.exit(1);
  }

  process.env.CDP_API_KEY_ID = env.CDP_API_KEY_ID ?? process.env.CDP_API_KEY_ID;
  process.env.CDP_API_KEY_SECRET = env.CDP_API_KEY_SECRET ?? process.env.CDP_API_KEY_SECRET;

  const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  const rpc = env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com";
  const client = createPublicClient({ chain: baseSepolia, transport: http(rpc) });

  const minWei = 50_000_000_000_000n; // ~0.00005 ETH (deploy ~0.00002)

  let balance = await client.getBalance({ address: account.address });
  console.log("Deployer:", account.address);
  console.log("Base Sepolia bakiye:", formatEther(balance), "ETH");
  console.log("RPC:", rpc);

  if (balance < minWei) {
    console.log("\nFaucet deneniyor (CDP — .env.local)...");
    await tryCdpFaucet(account.address, env);
    await new Promise((r) => setTimeout(r, 8000));
    balance = await client.getBalance({ address: account.address });
    console.log("Yeni bakiye:", formatEther(balance), "ETH");
  }

  if (balance < minWei) {
    console.log("\n--- Manuel adim (captcha gerekir) ---");
    console.log("Su adrese Base Sepolia test ETH gonderin (~0.001 ETH yeterli):");
    console.log(account.address);
    console.log("Faucet secenekleri:");
    console.log("  https://faucet.zalalena.com/base");
    console.log("  https://ethfaucet.com/networks/base/base-sepolia");
    console.log("\n120 saniye bekleniyor (faucet sonrasi otomatik deploy)...");
    balance = await waitForBalance(client, account.address, minWei, 120);
    console.log("\nBakiye:", formatEther(balance), "ETH");
  }

  if (balance < minWei) {
    console.error("\nYetersiz Base Sepolia ETH — deploy yapilamadi.");
    console.error("Faucet kullanip tekrar: npm run fund:base");
    console.error("veya CDP_API_KEY_ID + CDP_API_KEY_SECRET ekleyin.");
    process.exit(1);
  }

  console.log("\nBase kontrati deploy ediliyor...");
  const result = spawnSync("node", ["scripts/deploy.mjs", "--base-only"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  process.exit(result.status ?? 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
