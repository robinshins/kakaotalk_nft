import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navigation from "./components/Navigation";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'ChatNFT',
  description: 'ChatNFT Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('Layout mounted');
              window.addEventListener('load', () => {
                console.log('Window loaded');
              });
            `,
          }}
        />
      </head>
      <body 
        className={`${geistSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="min-h-screen">
          <Navigation />
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
