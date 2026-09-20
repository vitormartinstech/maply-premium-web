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
  title: "Maply | Destaque seus Serviços e Atraia Mais Clientes",
  description: "A plataforma ideal para profissionais e autônomos. Assine o Maply Premium, posicione o seu negócio no topo das buscas e receba orçamentos diretos.",
  keywords: [
    "divulgar serviços", 
    "captar clientes", 
    "diretório comercial", 
    "marketing para autônomos", 
    "anunciar negócios", 
    "Maply", 
    "Goiânia", 
    "Goiás"
  ],
};

// Se o seu Next.js estiver a pedir o tipo LayoutProps, certifique-se de que ele está definido, 
// ou use a tipagem padrão do React como abaixo para evitar erros:
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}