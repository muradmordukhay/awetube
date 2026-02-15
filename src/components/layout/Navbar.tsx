"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Upload,
  Menu,
  User,
  LogOut,
  Video,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "@/components/notifications/NotificationBell";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/" className="flex items-center gap-2">
          <Video className="h-6 w-6 text-red-600" />
          <span className="text-xl font-bold hidden sm:inline">AweTube</span>
        </Link>
      </div>

      {/* Center: Search */}
      <form
        onSubmit={handleSearch}
        className="flex flex-1 items-center justify-center max-w-xl mx-auto"
      >
        <div className="flex w-full">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="submit"
            variant="secondary"
            className="rounded-l-none border border-l-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Right: Upload + User */}
      <div className="flex items-center gap-2">
        {session?.user ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/upload")}
              title="Upload video"
            >
              <Upload className="h-5 w-5" />
            </Button>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={session.user.image || undefined}
                      alt={session.user.name || ""}
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user.image || undefined} />
                    <AvatarFallback>
                      {session.user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/studio")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Studio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const handle = (
                      session.user as Record<string, unknown>
                    ).channelHandle;
                    if (handle) router.push(`/channel/${handle}`);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Your channel
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button variant="outline" onClick={() => router.push("/login")}>
            <User className="mr-2 h-4 w-4" />
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}
