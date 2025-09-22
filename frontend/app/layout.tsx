import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";
import { AppProvider } from "@/context/app-context";
import { UserButton } from "@stackframe/stack";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Tourism",
  description: "UI demo — visa assistant wizard (mocked)",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <StackProvider app={stackServerApp}>
      <StackTheme>
        <AppProvider>
          <header className="flex justify-between items-center p-4 border-b">
            <h1 className="text-xl font-bold">Smart Tourism</h1>
            <UserButton showUserInfo={true} /> {/* 👈 add this */}
          </header>
          <main className="flex-1 p-4">{children}</main>
        </AppProvider>
      </StackTheme>
    </StackProvider>
    </body>
    </html>
  );
}