import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackServerApp } from "@/stack/server"
import { AppProvider } from "@/context/app-context"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Smart Tourism",
  description: "UI demo — visa assistant wizard (mocked)",
}

export default function RootLayout({
   children,
 }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <StackProvider app={stackServerApp}>
      <StackTheme>
        <AppProvider>
          {children}
        </AppProvider>
      </StackTheme>
    </StackProvider>
    </body>
    </html>
  )
}