import type { ReactNode } from "react";

interface KeralaSectionProps {
  title: string;
  right?: ReactNode;
  children: ReactNode;
}

export function KeralaSection({ title, right, children }: KeralaSectionProps) {
  return (
    <div className="rounded-t bg-white dark:bg-gray overflow-hidden">
      <div className="brand-sec-head flex justify-between items-center px-3 py-2 h-12">
        <p className="text-main text-sm font-bold">{title}</p>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}
