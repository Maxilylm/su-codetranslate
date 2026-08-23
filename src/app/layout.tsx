import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeTranslate — AI Code Translator",
  description:
    "Paste code in one language, get it translated to another. Powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-mono">
        {children}
              <script src="https://su-slopads.vercel.app/api/promo.js" defer></script>
      </body>
    </html>
  );
}
