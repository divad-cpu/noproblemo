import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NoProblemo",
  description: "A simple, reliable foundation for the NoProblemo project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
