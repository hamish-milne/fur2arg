import { useEffect, useRef, useState, type RefObject } from "react";

type OpenType = "modal" | "non-modal";

function setDialogOpen(
  ref: RefObject<HTMLDialogElement | null>,
  value: boolean,
  type?: OpenType
) {
  const { current: dialog } = ref;
  if (dialog && dialog.open !== value) {
    if (value) {
      if (type === "non-modal") {
        dialog.show();
      } else {
        dialog.showModal();
      }
    } else {
      dialog.close();
    }
  }
}

export function useDialogUncontrolled(type?: OpenType) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = ref.current?.open || false;
  const setOpen = (value: boolean) => setDialogOpen(ref, value, type);
  return [open, setOpen, ref] as const;
}

export function useDialogControlled(type?: OpenType) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies(type): 'type' is only used imperatively
  useEffect(() => setDialogOpen(ref, open, type), [open]);
  return [open, setOpen, ref] as const;
}
