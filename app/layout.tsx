import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import IntroVideoGate from "@/components/motion/IntroVideoGate";
import logo from "./KellzBank.png";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kellz | Personal banking, made clear",
  description: "A secure portfolio banking experience for managing accounts, spending, and transfers.",
  icons: { icon: logo.src },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#f5f7f4] text-[#142720] antialiased`}>
        <IntroVideoGate>{children}</IntroVideoGate>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
