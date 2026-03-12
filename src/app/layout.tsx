import type { Metadata } from "next";
import { Be_Vietnam_Pro, Open_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import FirebaseClientProvider from "@/firebase/client-provider";
import { LanguageProvider } from "@/context/LanguageContext";
import ConditionalLayout from "@/components/ConditionalLayout";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam-pro",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "HealthSphere",
  description: "Your personal health and nutrition companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          beVietnamPro.variable,
          openSans.variable
        )}
      >
        <LanguageProvider>
          <FirebaseClientProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </FirebaseClientProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
