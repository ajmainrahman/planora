import { useState, useCallback } from "react";

const KEY = "planora-bookmarks";

function load(): Set<number> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function save(set: Set<number>) {
  localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<number>>(load);

  const toggle = useCallback((id: number) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      save(next);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id: number) => bookmarks.has(id), [bookmarks]);

  return { bookmarks, toggle, isBookmarked };
}
