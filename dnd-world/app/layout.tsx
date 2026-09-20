import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Bell Below — Mournreach",
  description: "A private, persistent, mechanical dark-fantasy campaign.",
  applicationName: "Mournreach",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
