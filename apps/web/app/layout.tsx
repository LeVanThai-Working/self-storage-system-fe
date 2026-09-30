import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StorageHub",
  description: "Safe Space, More Possibilities",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Kalam:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-brand-pageBg text-neutral-main antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
