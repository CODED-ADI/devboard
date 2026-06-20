import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Providers } from "@/components/layouts/providers";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
