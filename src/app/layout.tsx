import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { ConditionalLayout } from "@/components/conditional-layout";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "HealthSphere",
  description: "Your personal health and wellness companion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className={inter.className}>
        <FirebaseClientProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
