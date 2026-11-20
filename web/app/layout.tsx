import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Manrope } from "next/font/google";
import { DocumentSheetProvider } from "@/components/DocumentSheet";
import { MotionMode, PageFade } from "@/components/motion";
import Presenter from "@/components/Presenter";
import Sidebar from "@/components/Sidebar";
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
        <MotionMode>
        <LangProvider>
          <DocumentSheetProvider>
            <div className="min-h-screen lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
              <Sidebar />
              <main className="min-w-0 px-4 pb-16 pt-6 sm:px-8 lg:px-12 lg:pt-10">
                <div className="mx-auto w-full max-w-[1180px]">
                  <PageFade>{children}</PageFade>
                </div>
              </main>
            </div>
            <Presenter />
          </DocumentSheetProvider>
        </LangProvider>
        </MotionMode>
      </body>
    </html>
  );
}
