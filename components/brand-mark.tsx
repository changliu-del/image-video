import { cn } from '@/lib/utils';

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-gray-950 shadow-sm ring-1 ring-white/20',
        className
      )}
    >
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.28),transparent_42%),linear-gradient(135deg,#ffffff,#e5e7eb)]" />
      <svg
        viewBox="0 0 40 40"
        className="relative size-[72%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 10.5h16"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.22"
        />
        <rect
          x="8.5"
          y="13"
          width="23"
          height="15.5"
          rx="4"
          fill="currentColor"
        />
        <path d="M18 17.25v7l6-3.5-6-3.5Z" fill="white" />
        <path
          d="M13 32h14"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
