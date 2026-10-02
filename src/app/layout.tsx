import type { Metadata } from "next";
import { Geist, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} · Attitude and aptitude assessments`,
    template: `%s · ${APP_NAME}`,
  },
  description: "A workspace for organizations to publish aptitude and attitude assessments, score them, and read the results.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${newsreader.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
