"use client";

import { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";

export default function MainWrapper({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const topPadding = pathname?.startsWith("/exam") ? "pt-0" : "pt-28";
  return <main className={topPadding}>{children}</main>;
}
