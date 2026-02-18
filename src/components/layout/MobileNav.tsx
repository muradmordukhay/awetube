"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Flame, Clock, ThumbsUp, FolderOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Video } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/trending", icon: Flame, label: "Trending" },
  { href: "/history", icon: Clock, label: "His Story" },
  { href: "/liked", icon: ThumbsUp, label: "Liked videos" },
  { href: "/library", icon: FolderOpen, label: "Library" },
];

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="flex flex-row items-center gap-2 border-b px-4 py-3">
          <SheetClose className="rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </SheetClose>
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <Video className="h-6 w-6 text-red-600" />
            <SheetTitle className="text-xl font-bold">AweTube</SheetTitle>
          </Link>
        </SheetHeader>
        <ScrollArea className="h-full py-2">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item, i) => (
              <div key={item.href}>
                {i === 2 && <Separator className="my-2" />}
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-4 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                    pathname === item.href
                      ? "bg-accent font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
