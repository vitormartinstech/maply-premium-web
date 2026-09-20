import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Maply | Encontre os Melhores Profissionais",
  description: "O melhor diretório para encontrar profissionais qualificados perto de você. Destaque o seu negócio ou encontre o serviço que precisa rapidamente.",
  keywords: [
    "serviços", 
    "profissionais", 
    "mapa de negócios", 
    "encontrar serviços", 
    "Maply", 
    "Goiânia", 
    "Goiás"
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}