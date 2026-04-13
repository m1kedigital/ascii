import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ASCII · Image to ASCII Art Converter",
  description:
    "Convert any image to ASCII art. Free, client-side, no upload required. A tool by m1ke.digital.",
  metadataBase: new URL("https://ascii.m1ke.digital"),
  openGraph: {
    title: "ASCII · Image to ASCII Art Converter",
    description: "Convert any image to ASCII art. Free, client-side, no upload.",
    url: "https://ascii.m1ke.digital",
    siteName: "ASCII",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "ASCII - Image to ASCII Art Converter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASCII · Image to ASCII Art Converter",
    description: "Convert any image to ASCII art. Free, client-side, no upload.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable}`} style={{ height: "100dvh" }}>
      <body className="flex flex-col bg-[#0a0a0a] text-white antialiased" style={{ height: "100dvh", overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
