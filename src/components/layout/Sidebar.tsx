"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, ListVideo, Clock, ThumbsUp, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  isOpen: boolean;
}

const mainNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/trending", icon: Flame, label: "Trending" },
  { href: "/subscriptions", icon: ListVideo, label: "Subscriptions" },
];

const libraryNavItems = [
  { href: "/history", icon: Clock, label: "His Story" },
  { href: "/liked", icon: ThumbsUp, label: "Liked videos" },
  { href: "/library", icon: FolderOpen, label: "Library" },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] bg-background border-r transition-all duration-200 hidden md:block",
          isOpen ? "w-60" : "w-[72px]"
        )}
      >
        <ScrollArea className="h-full py-2">
          <nav className="flex flex-col gap-1 px-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                  pathname === item.href
                    ? "bg-accent font-medium"
                    : "text-muted-foreground",
                  !isOpen && "flex-col gap-1 px-0 py-3 text-[10px] justify-center"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", !isOpen && "h-5 w-5")} />
                <span className={cn(isOpen ? "truncate" : "truncate text-center")}>
                  {item.label}
                </span>
              </Link>
            ))}

            {isOpen && (
              <>
                <Separator className="my-2" />
                <p className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Library
                </p>
                {libraryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                      pathname === item.href
                        ? "bg-accent font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
