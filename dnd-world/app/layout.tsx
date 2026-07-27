import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Living Campaign",
  description: "A persistent tabletop campaign dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
