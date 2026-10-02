import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CREDESS Construction",
  description:
    "Construction, architecture, études techniques et ingénierie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}