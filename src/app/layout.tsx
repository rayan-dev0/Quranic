import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navigation } from '@/components/Navigation'
import { LanguageProvider } from '@/contexts/LanguageContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quran App - Read, Learn, and Reflect",
  description: "A modern Quran reading experience with translations, audio, and more",
  keywords: "quran, islam, muslim, holy book, arabic, translation",
  authors: [{ name: "Your Name" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="min-h-screen bg-background">
              <Navigation />
              {children}
            </main>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
