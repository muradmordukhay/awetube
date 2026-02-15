"use client";

import { useState, useEffect } from "react";
import { ListPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PlaylistSummary {
  id: string;
  title: string;
  _count: { items: number };
}

interface SaveToPlaylistDialogProps {
  videoId: string;
}

export default function SaveToPlaylistDialog({
  videoId,
}: SaveToPlaylistDialogProps) {
  const [open, setOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [savingTo, setSavingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/playlists")
      .then((r) => r.json())
      .then((data) => setPlaylists(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  async function handleSave(playlistId: string) {
    setSavingTo(playlistId);
    try {
      await fetch(`/api/playlists/${playlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      setOpen(false);
    } catch {
      // ignore
    } finally {
      setSavingTo(null);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const playlist = await res.json();
        // Add video to the new playlist
        await fetch(`/api/playlists/${playlist.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId }),
        });
        setNewTitle("");
        setOpen(false);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-2">
          <ListPlus className="h-4 w-4" />
          Save
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : playlists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No playlists yet</p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleSave(pl.id)}
                disabled={savingTo === pl.id}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <span>{pl.title}</span>
                <span className="text-xs text-muted-foreground">
                  {pl._count.items} videos
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 border-t pt-3">
          <Input
            placeholder="New playlist name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!newTitle.trim() || creating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
