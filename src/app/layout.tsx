import type { Metadata } from "next";
import Script from "next/script";
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
      <body>
        {children}
        <Script
          src="https://unpkg.com/@webex/embedded-app-sdk@latest"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
