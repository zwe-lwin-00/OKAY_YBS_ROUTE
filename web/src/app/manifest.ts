import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YBS Finder",
    short_name: "YBS",
    description: "Yangon bus route and stop finder",
    start_url: "/",
    display: "standalone",
    background_color: "#eef3ef",
    theme_color: "#0b6b52",
    lang: "en",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
