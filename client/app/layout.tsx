import type { Metadata } from "next"
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "nimbkids.al — Project Estimate",
  description: "Build your nimbkids.al online shop package and get an instant price.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster theme="light" position="top-center" richColors />
      </body>
    </html>
  )
}
