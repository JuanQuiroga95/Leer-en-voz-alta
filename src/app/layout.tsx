import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Leer en Voz Alta — Universo Videla",
  description: "Simulador de lectura en voz alta para la Escuela Secundaria N° 4-012 Ingeniero Ricardo Videla",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
