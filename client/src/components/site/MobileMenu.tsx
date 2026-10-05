import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import type { Member } from "@/lib/auth";
import type { PublicView } from "@/lib/navigation";
import { ThemeToggle } from "./ThemeToggle";

const links: { view: PublicView; label: string }[] = [
  { view: "home", label: "Club" },
  { view: "book", label: "Book a court" },
  { view: "openplay", label: "Open Play" },
  { view: "news", label: "News" },
  { view: "account", label: "My bookings" },
];

export function MobileMenu({
  view,
  onNavigate,
  onAdmin,
  member,
  onSignOut,
  onSearch,
}: {
  view: PublicView;
  onNavigate: (view: PublicView) => void;
  onAdmin: () => void;
  member: Member | null;
  onSignOut: () => void;
  onSearch: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Close first so focus returns to the trigger before the next action runs.
  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="icon-button mobile-only" aria-label="Open menu">
          <Menu size={19} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="mobile-menu" aria-describedby={undefined}>
          <div className="mobile-menu-top">
            <Dialog.Title className="eyebrow">MENU</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close menu">
              <X size={19} />
            </Dialog.Close>
          </div>
          <nav aria-label="Mobile navigation">
            {links.map(link => (
              <button
                key={link.view}
                className={view === link.view ? "active" : ""}
                aria-current={view === link.view ? "page" : undefined}
                onClick={run(() => onNavigate(link.view))}
              >
                {link.label}
                <ArrowRight size={18} />
              </button>
            ))}
          </nav>
          <div className="mobile-menu-actions">
            <button className="outline-button" onClick={run(onSearch)}>
              <Search size={16} /> Search the site
            </button>
            {member ? (
              <button className="outline-button" onClick={run(onSignOut)}>
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <button
                className="outline-button"
                onClick={run(() => onNavigate("signin"))}
              >
                <LogIn size={16} /> Sign in or register
              </button>
            )}
            <button className="outline-button" onClick={run(onAdmin)}>
              <LayoutDashboard size={16} /> Club ops
            </button>
          </div>
          <div className="mobile-menu-theme">
            <span>Appearance</span>
            <ThemeToggle className="outline-button" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
