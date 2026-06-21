import type { Metadata } from "next";
import { Providers } from "@/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFT",
  description: "NFT — Monad ve Base test aglarinda ETH ile mint",
  applicationName: "NFT",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
