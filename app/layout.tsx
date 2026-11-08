import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

// Mesmas fontes do app: Montserrat nos títulos, Inter no texto
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Maply Premium | Seu negócio no topo do mapa",
  description: "Assine o Maply Premium: apareça primeiro nas buscas do bairro, receba clientes novos sem limite e veja quem salvou o seu perfil.",
  keywords: [
    "divulgar serviços",
    "captar clientes",
    "anunciar negócio local",
    "marketing para autônomos",
    "prestadores de serviço",
    "Maply",
    "Maply Premium"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
