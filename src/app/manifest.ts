import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wannago & Wanna Eats",
    short_name: "Wannago",
    description: "A concierge for stays and tables — tell us what you want, we'll take it from there.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf4ea",
    theme_color: "#33291f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
