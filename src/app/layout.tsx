import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// O par que a familia foi desenhada para formar: a condensada aperta as letras
// para caber titulo grande e numero grande, e cansa em texto corrido. Antes o
// app inteiro usava a condensada, inclusive nos paragrafos do guia.
const titulo = Barlow_Condensed({
  variable: "--font-titulo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

const corpo = Barlow({
  variable: "--font-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kelly Jhuly — Personal Trainer",
  description: "Sua planilha de treino, com vídeo de cada exercício.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${titulo.variable} ${corpo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
