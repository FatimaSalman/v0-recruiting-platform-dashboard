import type React from "react"
import { Inter } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import "./globals.css"
import type { Metadata } from "next"

// Use a system font or local font instead
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  // Add this to prevent Google Fonts fetching during build
  preload: false,
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "TalentHub - AI-Powered Recruitment Platform",
  description: "Find and manage top talent with AI-powered candidate matching",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
}

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode, params: { lang: string }
}>) {

  const direction = params?.lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html suppressHydrationWarning lang={params?.lang ?? 'en'} dir={direction}>
      <body className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
