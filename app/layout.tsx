import type { Metadata, Viewport } from "next";
import Footer from "@/components/Footer";
import { Hind_Siliguri, Tiro_Bangla, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Toaster from "@/components/Toaster";
import "./globals.css";

const hind = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-hind" });
const tiro = Tiro_Bangla({ subsets: ["bengali", "latin"], weight: "400", variable: "--font-tiro" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: "500", variable: "--font-mono" });

export const metadata: Metadata = {
  title: "দুগ্ধ সমবায় পোর্টাল",
  description: "খামারীদের পরামর্শ, সমিতির দুধ-সঞ্চয়-ঋণের ডিজিটাল খাতা, প্রজনন ক্যালেন্ডার, প্রশিক্ষণ ও খামার ক্যালকুলেটর।",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3EA" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1412" },
  ],
};

// Applies the saved theme before first paint so there is no light/dark flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${hind.variable} ${tiro.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Nav />
        <main>
          <div className="wrap">{children}</div>
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
