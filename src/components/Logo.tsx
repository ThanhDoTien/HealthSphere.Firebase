import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-full", className)}>
      <Image
        src="/logo.png"
        alt="HealthSphere Logo"
        width={40}
        height={40}
        className="object-cover"
        priority
      />
    </div>
  );
}
