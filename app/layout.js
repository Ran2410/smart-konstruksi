import { Geist, Geist_Mono, Hanken_Grotesk, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "material-symbols/outlined.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Smart Konstruksi",
  description: "Construction Management Platform - PT. Kita Satu Intersolusi",
  icons: {
    icon: [
      { url: "/smartkonstrunksi.svg", type: "image/svg+xml" },
      { url: "/smartkonstrunksi.jpeg", type: "image/jpeg" },
    ],
    apple: "/smartkonstrunksi.jpeg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
