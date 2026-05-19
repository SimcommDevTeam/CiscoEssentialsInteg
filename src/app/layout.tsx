import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webex Calling Integration",
  description: "Cisco Webex inspired calling integration dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
