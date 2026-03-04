import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnySpend Farcaster Demo",
  description: "AnySpend integration for Farcaster frames",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
