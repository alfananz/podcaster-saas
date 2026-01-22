import type { Metadata } from "next";
import { Epilogue, Public_Sans } from "next/font/google";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Mello Studio Dashboard",
  description: "Creator Pro Dashboard",
};

import { ModalProvider } from "@/context/ModalContext";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${epilogue.variable} ${publicSans.variable} font-display antialiased bg-background-light dark:bg-background-dark text-white min-h-screen aurora-bg selection:bg-primary/30 selection:text-white`}>
        <ConvexClientProvider>
          <AuthProvider>
            <ModalProvider>
              {children}
            </ModalProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
