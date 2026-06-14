#!/usr/bin/env node
/**
 * Deploy TestNetworkNFT to Monad Testnet and Base Sepolia.
 * Usage: npm run deploy
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractsDir = join(root, "contracts");

function loadDotEnv(path) {
  if (!existsSync(path)) return {};
  const map = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
    map[key] = value;
  }
  return map;
}

function upsertEnvLocal(updates) {
  const path = join(root, ".env.local");
  const lines = existsSync(path) ? readFileSync(path, "utf8").split("\n") : [];
  const seen = new Set();

  for (const [key, value] of Object.entries(updates)) {
    let replaced = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`) || lines[i].startsWith(`# ${key}=`)) {
        lines[i] = `${key}=${value}`;
        replaced = true;
        break;
      }
    }
    if (!replaced) lines.push(`${key}=${value}`);
    seen.add(key);
  }

  writeFileSync(path, `${lines.filter((line, idx, arr) => line.length || idx < arr.length - 1).join("\n")}\n`, "utf8");
  for (const key of seen) {
    console.log(`Updated .env.local: ${key}`);
  }
}

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: options.cwd ?? root,
    env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--use-system-ca", ...options.env },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function hasForge() {
  const result = spawnSync("forge", ["--version"], { shell: true, stdio: "pipe" });
  return result.status === 0;
}

function extractAddress(output) {
  const match = output.match(/TestNetworkNFT deployed at:\s*(0x[a-fA-F0-9]{40})/);
  return match?.[1] ?? null;
}

function deployNetwork({ networkName, rpcUrl, name, symbol, metadataUri, envKey, sharedEnv }) {
  console.log(`\n=== Deploy: ${networkName} ===`);

  const result = spawnSync(
    "forge",
    [
      "script",
      "script/DeployTestNFT.s.sol:DeployTestNFT",
      "--rpc-url",
      rpcUrl,
      "--broadcast",
      "-vvv",
    ],
    {
      cwd: contractsDir,
      env: {
        ...process.env,
        NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--use-system-ca",
        ...sharedEnv,
        NFT_NAME: name,
        NFT_SYMBOL: symbol,
        NFT_METADATA_URI: metadataUri,
      },
      shell: true,
      encoding: "utf8",
    },
  );

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output) process.stdout.write(output);

  if (result.status !== 0) {
    console.error(`Deploy failed on ${networkName}`);
    return null;
  }

  const addr = extractAddress(output);
  if (addr) {
    console.log(`Address: ${addr}`);
    upsertEnvLocal({ [envKey]: addr });
  } else {
    console.warn("Could not parse deployed address — check forge output.");
  }
  return addr;
}

const env = {
  ...loadDotEnv(join(root, ".env")),
  ...loadDotEnv(join(root, ".env.local")),
};

const deployerKey = env.DEPLOYER_PRIVATE_KEY;
if (!deployerKey) {
  console.error("DEPLOYER_PRIVATE_KEY missing — add it to .env.local");
  process.exit(1);
}

const treasury = env.NFT_TREASURY || "0x1491baEd4db010D8F8B54cED442aF3326ed2c77a";
const siteUrl = (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const maxSupply = env.NFT_MAX_SUPPLY || "200";
const mintPriceWei = env.NFT_MINT_PRICE_WEI || "100000000000000";
const monadRpc = env.NEXT_PUBLIC_MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz";
const baseRpc = env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://base-sepolia-rpc.publicnode.com";

if (!hasForge()) {
  console.error("Foundry (forge) not found. Install: https://book.getfoundry.sh/getting-started/installation");
  process.exit(1);
}

if (!existsSync(join(contractsDir, "lib", "openzeppelin-contracts"))) {
  console.log("Installing OpenZeppelin...");
  run(
    "forge",
    ["install", "OpenZeppelin/openzeppelin-contracts@v5.0.2", "--no-commit"],
    { cwd: contractsDir },
  );
}

if (!existsSync(join(contractsDir, "lib", "forge-std", "src", "Script.sol"))) {
  console.log("Installing forge-std...");
  run("forge", ["install", "foundry-rs/forge-std", "--no-commit"], { cwd: contractsDir });
}

console.log("Building contracts...");
run("forge", ["build"], { cwd: contractsDir });

const sharedEnv = {
  DEPLOYER_PRIVATE_KEY: deployerKey,
  NFT_MAX_SUPPLY: maxSupply,
  NFT_MINT_PRICE_WEI: mintPriceWei,
  NFT_TREASURY: treasury,
};

const skipMonad = process.argv.includes("--base-only");
const skipBase = process.argv.includes("--monad-only");

let monadAddr = null;
let baseAddr = null;

if (!skipMonad) {
  monadAddr = deployNetwork({
    networkName: "Monad Testnet",
    rpcUrl: monadRpc,
    name: "AKLN Monad",
    symbol: "AKLN-M",
    metadataUri: env.NFT_MONAD_METADATA_URI || `${siteUrl}/api/nft/metadata/monad`,
    envKey: "NEXT_PUBLIC_MONAD_NFT_ADDRESS",
    sharedEnv,
  });
}

if (!skipBase) {
  baseAddr = deployNetwork({
    networkName: "Base Sepolia",
    rpcUrl: baseRpc,
    name: "AKLN Base",
    symbol: "AKLN-B",
    metadataUri: env.NFT_BASE_METADATA_URI || `${siteUrl}/api/nft/metadata/base`,
    envKey: "NEXT_PUBLIC_BASE_NFT_ADDRESS",
    sharedEnv,
  });
}

console.log("\n=== Summary ===");
console.log(`Treasury: ${treasury}`);
console.log(`Max supply: ${maxSupply} | Mint price: 0.0001 native token`);
if (monadAddr) console.log(`Monad NFT: ${monadAddr}`);
if (baseAddr) console.log(`Base NFT: ${baseAddr}`);
console.log("\nFrontend: npm run dev -> http://localhost:3000");

const attemptedBase = !skipBase;
const attemptedMonad = !skipMonad;
const failed =
  (attemptedMonad && !monadAddr) || (attemptedBase && !baseAddr);
if (failed) process.exit(1);
