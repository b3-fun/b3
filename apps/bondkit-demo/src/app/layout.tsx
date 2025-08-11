import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { B3ProviderWrapper } from "./b3ProviderWrapper";
import "./globals.css";
import { Providers } from "./providers";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bondkit Demo",
  description: "A demo for Bondkit SDK",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <B3ProviderWrapper>{children}</B3ProviderWrapper>
        </Providers>
      </body>
    </html>
  );
}
