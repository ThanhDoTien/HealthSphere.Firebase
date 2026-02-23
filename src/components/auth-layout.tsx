import { Icons } from './icons';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Icons.logo className="h-12 w-12 text-primary" />
        </div>
        {children}
      </div>
    </div>
  );
}
