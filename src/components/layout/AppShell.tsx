"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { cn } from "@/lib/utils";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMenuToggle = () => {
    // On mobile, open sheet; on desktop, toggle sidebar width
    if (window.innerWidth < 768) {
      setMobileNavOpen(true);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuToggle={handleMenuToggle} />
      <Sidebar isOpen={sidebarOpen} />
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <main
        className={cn(
          "pt-2 pb-8 transition-all duration-200",
          "md:ml-[72px]",
          sidebarOpen && "md:ml-60"
        )}
      >
        <div className="px-4 lg:px-6">{children}</div>
      </main>
    </div>
  );
}
