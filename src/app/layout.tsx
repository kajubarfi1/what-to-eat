import "./globals.css";
import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { DoodleDefs } from "@/components/Doodle";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "What should we eat?",
  description: "Answer a few questions, then crown your winner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <DoodleDefs />
        {children}
      </body>
    </html>
  );
}
