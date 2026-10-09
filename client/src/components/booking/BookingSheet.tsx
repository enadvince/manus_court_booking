import type { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

/** Mobile checkout bottom sheet. Its own module so vaul loads on first use. */
export default function BookingSheet({
  open,
  onClose,
  header,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  header: ReactNode;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <Drawer open={open} onOpenChange={next => !next && onClose()}>
      <DrawerContent
        className="book-sheet"
        aria-describedby="sheet-description"
      >
        <div className="sheet-scroll">
          {header}
          <DrawerTitle className="checkout-title">{title}</DrawerTitle>
          <DrawerDescription id="sheet-description" className="sheet-summary">
            {description}
          </DrawerDescription>
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
