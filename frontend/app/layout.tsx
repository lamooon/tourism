import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {StackProvider, StackTheme} from "@stackframe/stack";
import {stackServerApp} from "@/stack/server";
import {AppProvider} from "@/context/app-context";
import {UserButton} from "@stackframe/stack";
import UserSync from "@/components/user-sync";

import Link from "next/link";

const geistSans = Geist({variable: "--font-geist-sans", subsets: ["latin"]});
const geistMono = Geist_Mono({variable: "--font-geist-mono", subsets: ["latin"]});

export const metadata: Metadata = {
  title: "Smart Tourism",
  description: "UI demo — visa assistant wizard (mocked)",
};

export default function RootLayout({
     children,
   }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{colorScheme: "dark"}}>
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
    <StackProvider app={stackServerApp}>
      <StackTheme><AppProvider>
        <UserSync>
          {/* CHANGE 1: Remove p-4 from header and set it to full width and border-b only */}
          <header className="w-full border-b">
            {/* CHANGE 2: Add inner container for alignment and spacing */}
            <div className="flex justify-between items-center mx-auto max-w-7xl p-4">

              {/* CHANGE 3: Restore hover effects and add clickable padding (p-2) */}
              <Link
                href="/"
                className="text-xl font-bold cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-800"
              >
                Smart Tourism
              </Link>
              <UserButton showUserInfo={true}/>
            </div>
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
