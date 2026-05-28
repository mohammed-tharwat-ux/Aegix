import type { PropsWithChildren } from "react";

interface PanelProps extends PropsWithChildren {
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-[28px] border border-cyan-200/10 bg-panel shadow-[0_22px_70px_rgba(0,0,0,0.34),0_0_34px_rgba(34,211,238,0.07)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </section>
  );
}
