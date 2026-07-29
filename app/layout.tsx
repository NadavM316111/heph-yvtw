import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Confi Messaging",
  description: "Confidential messaging with NDA protection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}