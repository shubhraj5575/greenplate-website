import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GreenPlate — Measure what you serve",
    template: "%s · GreenPlate",
  },
  description:
    "Carbon footprint measurement for India's food sector — built on real LCA data for individuals and food-service businesses.",
  metadataBase: new URL("https://greenplate.in"),
  openGraph: {
    title: "GreenPlate",
    description:
      "Carbon footprint measurement for India's food sector. Numbers first, claims second.",
    url: "https://greenplate.in",
    siteName: "GreenPlate",
    locale: "en_IN",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "GreenPlate" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              background: "var(--color-cream-50)",
              border: "1px solid rgba(47,92,70,0.15)",
              color: "var(--color-ink-900)",
            },
          }}
        />
      </body>
    </html>
  );
}
