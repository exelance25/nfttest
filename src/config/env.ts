import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_WC_PROJECT_ID: z.string().min(1).default("replace_wallet_connect_key"),
  NEXT_PUBLIC_MONAD_TESTNET_RPC: z
    .string()
    .url()
    .default("https://testnet-rpc.monad.xyz"),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: z
    .string()
    .url()
    .default("https://sepolia.base.org"),
  NEXT_PUBLIC_MONAD_NFT_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_BASE_NFT_ADDRESS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
  NEXT_PUBLIC_MONAD_TESTNET_RPC: process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC,
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  NEXT_PUBLIC_MONAD_NFT_ADDRESS: process.env.NEXT_PUBLIC_MONAD_NFT_ADDRESS,
  NEXT_PUBLIC_BASE_NFT_ADDRESS: process.env.NEXT_PUBLIC_BASE_NFT_ADDRESS,
});

if (!parsed.success && process.env.NODE_ENV === "development") {
  console.warn("[env] Missing values — defaults applied:", parsed.error.flatten());
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
