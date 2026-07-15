import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";
export default function sitemap(): MetadataRoute.Sitemap { const base = publicEnv.appUrl.replace(/\/$/, ""); return [{ url: base, changeFrequency: "monthly", priority: 1 }, { url: `${base}/play`, changeFrequency: "weekly", priority: 0.8 }, { url: `${base}/play/celo`, changeFrequency: "daily", priority: 0.8 }, { url: `${base}/play/stacks`, changeFrequency: "daily", priority: 0.8 }]; }
