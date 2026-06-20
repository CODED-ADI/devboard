import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/layouts/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "DevBoard",
    template: "%s | DevBoard",
  },
  description:
    "GitHub-integrated Kanban boards for developers. Sync Issues, manage sprints.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
