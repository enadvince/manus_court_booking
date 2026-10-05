import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { navigateTo } from "@/lib/navigation";
import { buildSearchIndex, searchSite, type SearchItem } from "@/lib/search";

export const OPEN_SEARCH_EVENT = "baseline:open-search";

export function openSearch() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** Site-wide search palette. Opens with "/" or Ctrl/⌘ + K. */
export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const index = useMemo(() => buildSearchIndex(), []);
  const results = useMemo(
    () =>
      query.trim()
        ? searchSite(query, index)
        : index.filter(item => item.group === "Pages"),
    [index, query]
  );
  // Results arrive best-first, so groups appear in order of their best match.
  const groups = Array.from(new Set(results.map(item => item.group)));

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (event: KeyboardEvent) => {
      const shortcut =
        (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" &&
          !isTypingTarget(event.target) &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey);
      if (!shortcut) return;
      event.preventDefault();
      setOpen(value => !value);
    };
    window.addEventListener(OPEN_SEARCH_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const choose = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    navigateTo(item.target);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={value => {
        setOpen(value);
        if (!value) setQuery("");
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="search-panel" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Search the site</Dialog.Title>
          <Command shouldFilter={false} loop label="Search the site">
            <div className="search-input">
              <Search size={18} aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search courts, FAQs, news…"
              />
              <kbd>Esc</kbd>
            </div>
            <Command.List className="search-results">
              <Command.Empty className="search-empty">
                No results for “{query.trim()}”. Try “cancel”, “price” or “open
                play”.
              </Command.Empty>
              {groups.map(group => {
                const items = results.filter(item => item.group === group);
                return (
                  <Command.Group
                    key={group}
                    heading={query.trim() ? group : "Jump to"}
                  >
                    {items.map(item => (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => choose(item)}
                      >
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                        <CornerDownLeft size={14} aria-hidden="true" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                );
              })}
            </Command.List>
          </Command>
          <p className="search-hint" aria-hidden="true">
            <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> to open ·{" "}
            <kbd>/</kbd> or <kbd>Ctrl K</kbd> anywhere
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
