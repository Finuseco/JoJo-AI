import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Logo hibou + nom « JoJo AI » dans le style des affiches. */
export function JojoBrand({
  size = 40,
  showName = true,
  className,
}: {
  size?: number;
  showName?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logos/icon.png"
        alt="Logo JoJo AI"
        width={size}
        height={size}
        priority
        className="rounded-[22%] shadow-[0_8px_30px_rgba(99,102,241,0.55)]"
      />
      {showName && (
        <span
          className="font-bold leading-none tracking-tight text-white"
          style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', fontSize: size * 0.62 }}
        >
          JoJo{' '}
          <span className="bg-gradient-to-r from-purple-400 to-fuchsia-300 bg-clip-text text-transparent">AI</span>
        </span>
      )}
    </div>
  );
}
