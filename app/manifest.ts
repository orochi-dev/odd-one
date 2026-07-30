import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Odd One",
    short_name: "Odd One",
    description: "A free strategy game of nerve on Celo and Stacks with no entry fee or prize pool. Pick a low number, reveal it, and hope nobody thought like you.",
    categories: ["games", "entertainment"],
    lang: "en",
    id: "/",
    start_url: "/play",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090F",
    theme_color: "#09090F",
    shortcuts: [
      { name: "Open Celo lobby", short_name: "Celo lobby", description: "Jump straight into the Odd One lobby on Celo.", url: "/play/celo" },
      { name: "Open Stacks lobby", short_name: "Stacks lobby", description: "Jump straight into the Odd One lobby on Stacks.", url: "/play/stacks" }
    ],
    screenshots: [
      {
        src: "/og.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: "Odd One landing page preview with the Go low. Stay unique. tagline."
      }
    ],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
