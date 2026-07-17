import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ASCII · Photo to type lab",
  description:
    "Convert any image to ASCII art. Client-side, no upload. A tool by m1ke.digital.",
  metadataBase: new URL("https://ascii.m1ke.digital"),
  openGraph: {
    title: "ASCII · Photo to type lab",
    description: "Convert any image to ASCII art. Client-side, no upload.",
    url: "https://ascii.m1ke.digital",
    siteName: "ASCII",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ASCII — Photo to type lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASCII · Photo to type lab",
    description: "Convert any image to ASCII art. Client-side, no upload.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={ibmPlexMono.variable}>
      <body>{children}</body>
    </html>
  );
}
