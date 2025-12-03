import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Web3 Portfolio Protocol | Full-Stack Blockchain Developer",
  description: "Interactive Web3 portfolio showcasing blockchain projects, smart contracts, and decentralized technologies. Connect your wallet to explore.",
  keywords: ["Web3", "Blockchain", "Solidity", "Smart Contracts", "DeFi", "NFT", "Portfolio"],
  authors: [{ name: "Officialhomie" }],
  openGraph: {
    title: "Web3 Portfolio Protocol",
    description: "Interactive Web3 portfolio showcasing blockchain projects",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
