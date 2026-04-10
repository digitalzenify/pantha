import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Pantha — AI-Powered Life Assistant",
  description:
    "Open-source, self-hostable Notion alternative with built-in AI. Bring your own API key.",
  icons: {
    icon: "/logo.svg",
  },
};

/**
 * Root layout wrapping the entire application.
 * Includes theme provider and session provider.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
