import type { Metadata, Viewport } from "next";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import "./app.css";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.appUrl), title: { default: "Odd One — Go low. Stay unique.", template: "%s · Odd One" },
  description: "A fast onchain game of nerve. Pick a low number, reveal it, and hope nobody thought like you.",
  alternates: { canonical: "/" }, manifest: "/manifest.webmanifest",
  openGraph: { title: "Odd One", description: "Go low. Stay unique.", images: [{ url: "/og.png", width: 1200, height: 630 }], type: "website" },
  twitter: { card: "summary_large_image", title: "Odd One", description: "Go low. Stay unique.", images: ["/og.png"] },
  other: publicEnv.talentVerification ? { "talentapp:project-verification": publicEnv.talentVerification } : {}
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#09090F", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
