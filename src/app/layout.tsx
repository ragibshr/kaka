import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Kaka — তোমার AI সঙ্গী",
  description: "Personal life-organizer AI companion. তোমার জীবনের সব তথ্য গুছিয়ে রাখো।",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className="h-full antialiased">
      <body className="h-full flex flex-col md:flex-row overflow-hidden">
        <Providers>
          {/* Desktop sidebar — hidden on mobile */}
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </main>

          {/* Mobile bottom nav — hidden on desktop */}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
