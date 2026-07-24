import type { Metadata, Viewport } from "next";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";
import "./app.css";
import { publicEnv } from "@/lib/env";

export const metadata: Metadata = {
  applicationName: "Odd One",
  metadataBase: new URL(publicEnv.appUrl), title: { default: "Odd One — Go low. Stay unique.", template: "%s · Odd One" },
  description: "A free strategy game of nerve on Celo and Stacks. Pick a low number, reveal it, and hope nobody thought like you.",
  alternates: { canonical: "/" }, manifest: "/manifest.webmanifest",
  openGraph: { title: "Odd One", description: "A free strategy game of nerve on Celo and Stacks. Go low. Stay unique.", siteName: "Odd One", images: [{ url: "/og.png", width: 1200, height: 630, alt: "Odd One strategy game preview art with the tagline Go low. Stay unique." }], type: "website" },
  twitter: { card: "summary_large_image", title: "Odd One — Go low. Stay unique.", description: "A free strategy game of nerve on Celo and Stacks. Pick a low number, reveal it, and hope nobody thought like you.", images: [{ url: "/og.png", alt: "Odd One strategy game preview art with the tagline Go low. Stay unique." }] },
  other: publicEnv.talentVerification ? { "talentapp:project_verification": publicEnv.talentVerification } : {}
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#09090F", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
