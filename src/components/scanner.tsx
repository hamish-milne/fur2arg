import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export function useScanner(options: {
  onScan: (this: void, serialNo: string) => void;
  onError?: (this: void, error: string) => void;
}) {
  const { onScan, onError } = options;
  const ndefSupported = "NDEFReader" in window;
  const ndef = useMemo(
    () => (ndefSupported ? new NDEFReader() : undefined),
    [ndefSupported]
  );

  useEffect(() => {
    if (!ndef) {
      return;
    }
    const onRead = (event: Event) => {
      if (event instanceof NDEFReadingEvent) {
        onScan(event.serialNumber);
      } else {
        console.warn("Unexpected event type:", event);
      }
    };
    const onErrorEvent = (event: Event) => {
      if (event instanceof ErrorEvent) {
        onError?.(event.message);
      }
    };
    ndef.addEventListener("reading", onRead);
    ndef.addEventListener("error", onErrorEvent);
    return () => {
      ndef.removeEventListener("reading", onRead);
      ndef.removeEventListener("error", onErrorEvent);
    };
  }, [ndef, onScan, onError]);

  const { mutate: startScan, status: scanState } = useMutation({
    mutationFn: () =>
      ndef?.scan() ?? Promise.reject("NDEFReader not available"),
  });

  return { startScan, scanState: ndef ? scanState : "unavailable" } as const;
}
