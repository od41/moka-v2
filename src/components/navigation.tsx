"use client";

import { usePathname } from "next/navigation";

const Navigation = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="z-10 max-w-5xl w-full items-center justify-between text-gray-800 text-sm lg:flex">
      {children}
    </div>
  );
};

export default Navigation;
