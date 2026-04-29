/**
 * @file Shared dashboard Card primitive.
 * @module ui/Card
 */

import { cn } from '@/app/_lib/utils';

export function Card({ className, children, as: As = 'div', ...rest }) {
  return (
    <As
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm shadow-sm',
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function CardHeader({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-3.5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ icon: Icon, className, children }) {
  return (
    <h3
      className={cn(
        'flex items-center gap-2 text-[13px] font-semibold tracking-tight text-gray-200',
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-gray-500" />}
      {children}
    </h3>
  );
}

export function CardBody({ className, children, ...rest }) {
  return (
    <div className={cn('p-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-white/[0.05] px-5 py-3',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
