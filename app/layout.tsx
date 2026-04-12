import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ASCII Art Converter",
  description: "Free image-to-ASCII art converter. Drop your image to get started.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
