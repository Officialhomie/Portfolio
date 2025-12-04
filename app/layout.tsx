import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { StructuredData } from "./components/StructuredData";

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
  title: "OneTrueHomie Portfolio Protocol | Full-Stack Blockchain Developer",
  description: "Interactive Web3 portfolio showcasing blockchain projects, smart contracts, and decentralized technologies. Connect your wallet to explore.",
  keywords: ["Web3", "Blockchain", "Solidity", "Smart Contracts", "DeFi", "NFT", "Portfolio", "Base Mainnet", "OneTrueHomie"],
  authors: [{ name: "OneTrueHomie" }],
  openGraph: {
    title: "OneTrueHomie Portfolio Protocol",
    description: "Interactive Web3 portfolio showcasing blockchain projects, smart contracts, and decentralized technologies.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OneTrueHomie Portfolio Protocol",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneTrueHomie Portfolio Protocol",
    description: "Interactive Web3 portfolio showcasing blockchain projects",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
