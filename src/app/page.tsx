'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <span className="text-primary">Health</span>Sphere
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground">
            {t('home.subtitle')}
          </p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/login">{t('home.login')}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">{t('home.signup')}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
