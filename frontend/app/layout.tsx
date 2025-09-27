import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/stack/server";
import { AppProvider } from "@/context/app-context";
import { UserButton } from "@stackframe/stack";
import UserSync from "@/components/user-sync";

import Link from "next/link"; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
          <UserSync>
            <header className="flex justify-between items-center p-4 border-b">
              {/* CHANGE: Replaced <h1> with <Link> and added click/hover styles */}
              <Link
                href="/" // Sets the target URL to the home page
                className="text-xl font-bold px-3 py-1 rounded-md transition-colors duration-200 hover:bg-gray-100 cursor-pointer" // Added padding, rounded corners, and hover effect
              >
                Smart Tourism
              </Link>
              {/* END CHANGE */}
              <UserButton showUserInfo={true} />
            </header>
            <main className="flex-1 p-4">{children}</main>
          </UserSync>
        </AppProvider>
      </StackTheme>
    </StackProvider>
    </body>
    </html>
  );
}
