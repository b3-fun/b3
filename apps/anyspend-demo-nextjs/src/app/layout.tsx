import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AnySpend Demo",
  description: "Demo application for AnySpend integration",
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
