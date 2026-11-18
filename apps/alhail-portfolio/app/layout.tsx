import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import { DocumentSheetProvider } from "@/components/DocumentSheet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LangProvider } from "@/lib/i18n";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const arabic = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Al Hail · Group Portfolio Copilot",
  description: "AI portfolio intelligence demo prepared for Al Hail Holding by NinjaTech",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${manrope.variable} ${arabic.variable} antialiased`}>
        <LangProvider>
          <DocumentSheetProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
              <Footer />
            </div>
          </DocumentSheetProvider>
        </LangProvider>
      </body>
    </html>
  );
}
