
import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import FirebaseClientProvider from "@/firebase/client-provider";
import { LanguageProvider } from "@/context/LanguageContext";
import ConditionalLayout from "@/components/ConditionalLayout";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

const sora = Sora({ 
  subsets: ["latin"], 
  variable: "--font-sora" 
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
          inter.variable,
          sora.variable
        )}
      >
        <LanguageProvider>
          <FirebaseClientProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </FirebaseClientProvider>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
