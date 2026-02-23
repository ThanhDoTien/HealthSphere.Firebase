'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RootPage() {
  const cyclistsImage = PlaceHolderImages.find(
    (img) => img.id === 'landing-cyclists'
  );
  const runnersImage = PlaceHolderImages.find(
    (img) => img.id === 'landing-runners'
  );

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="w-full absolute top-0 z-10">
        <nav className="container mx-auto flex items-center justify-between p-4 bg-transparent">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl text-foreground">
              HealthSphere
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" className="bg-white/80 backdrop-blur-sm">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex-grow grid grid-cols-1 md:grid-cols-3">
        <div className="hidden md:block relative h-full">
          {cyclistsImage && (
            <Image
              src={cyclistsImage.imageUrl}
              alt={cyclistsImage.description}
              fill
              className="object-cover"
              data-ai-hint={cyclistsImage.imageHint}
              priority
            />
          )}
        </div>

        <div className="flex flex-col justify-center items-center text-center p-6 md:p-12 space-y-6 min-h-screen">
          <h1 className="text-4xl font-bold tracking-tight">
            Community-Powered Motivation
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Track your progress and cheer each other on. Join over 100 million
            active people on HealthSphere for free.
          </p>

          <div className="text-sm">
            <span>Already a Member? </span>
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              Log In
            </Link>
          </div>

          <div className="w-full max-w-xs space-y-3 pt-4">
            <Button variant="outline" className="w-full justify-center">
              <Icons.google />
              Sign Up With Google
            </Button>
            <Button variant="outline" className="w-full justify-center">
              <Icons.apple />
              Sign Up With Apple
            </Button>
            <Button asChild className="w-full">
              <Link href="/signup">
                <Icons.mail className="mr-2 h-4 w-4" />
                Sign Up With Email
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground max-w-xs pt-4">
            By continuing, you are agreeing to our Terms of Service and Privacy
            Policy.
          </p>
        </div>

        <div className="hidden md:block relative h-full">
          {runnersImage && (
            <Image
              src={runnersImage.imageUrl}
              alt={runnersImage.description}
              fill
              className="object-cover"
              data-ai-hint={runnersImage.imageHint}
              priority
            />
          )}
        </div>
      </main>
    </div>
  );
}
