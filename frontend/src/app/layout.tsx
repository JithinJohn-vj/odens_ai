import type { Metadata } from "next";
import ClientLayout from './ClientLayout';
import './globals.css';

export const metadata: Metadata = {
  title: "Quote AI",
  description: "AI-powered quote generation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
