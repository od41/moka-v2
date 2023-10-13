"use client";
import Header from "@/components/header";
import "./globals.css";
import "@near-wallet-selector/modal-ui/styles.css";
import { Quattrocento, Source_Sans_3 } from "next/font/google";
import Footer from "@/components/footer";
import Providers from "@/providers/providers";
import Navigation from "@/components/navigation";
import Modal from "@/components/modal";
import type { Metadata } from 'next'
import { constants } from "@/constants";

export const metadata: Metadata = {
  title: constants.appName,
  description: constants.twitterText,
}

export const serif = Quattrocento({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
});

export const sansSerif = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${sansSerif.className} flex min-h-screen flex-col items-center justify-between overflow-x-hidden`}
      >
        <div className="flex flex-col min-h-screen relative bg-mainBg w-screen">
          <Providers>
            <Navigation>
              <Header />
              <Footer />
            </Navigation>

            {children}

            <Modal></Modal>
          </Providers>
        </div>
      </body>
    </html>
  );
}
