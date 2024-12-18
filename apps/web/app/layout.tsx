import type { Metadata } from "next"
import { Viewport } from "next"
import localFont from "next/font/local"
import MenuBar from "@/components/menu-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { siteConfig } from "@/config/site"

import { cn } from "@repo/ui/utils"

import "@repo/ui/styles"

import { Toaster } from "@repo/ui/toaster"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
})
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "reactjs",
    "nextjs",
    "composable",
    "tags-input",
    "tags input",
    "tailwindcss",
    "radix-ui",
    "shadcn-ui",
  ],
  authors: [
    {
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
  ],
  creator: siteConfig.author.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.author.name,
  },
  icons: {
    icon: "/icon.png",
  },
}

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={cn("min-h-svh p-8", geistSans.variable, geistMono.variable)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="mx-auto h-full w-full max-w-[800px]">
            <MenuBar />
            <div className="mt-6">{children}</div>
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
