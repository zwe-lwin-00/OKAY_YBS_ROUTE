import type { Metadata, Viewport } from "next";
import { Figtree, Noto_Sans_Myanmar, Syne } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoMm = Noto_Sans_Myanmar({
  variable: "--font-noto-mm",
  subsets: ["myanmar"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "YBS Finder — Yangon Bus Routes",
    template: "%s · YBS Finder",
  },
  description:
    "Mobile-first Yangon YBS bus route and stop finder. Search lines, browse stops, and see maps. Static data — not live tracking.",
  applicationName: "YBS Finder",
  appleWebApp: {
    capable: true,
    title: "YBS Finder",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f7f5",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${figtree.variable} ${notoMm.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
