import type React from "react"
import { Geist, Geist_Mono, Cairo } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "./providers"
import "./globals.css"
import type { Metadata } from "next"

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif']
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['monospace']
})

const cairo = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  fallback: ['sans-serif']
})

export const metadata: Metadata = {
  title: "TalentHub - AI-Powered Recruitment Platform",
  description: "Find and manage top talent with AI-powered candidate matching",
  generator: "v0.app",
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
      <body className={direction === 'rtl' ? `${cairo.className} antialiased` : `${geist.className} ${geistMono.className} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
