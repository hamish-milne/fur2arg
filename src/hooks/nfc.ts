import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";

export function useNfc() {
  const supported = "NDEFReader" in window;
  const ndefReader = useRef<[NDEFReader, AbortController]>(null);
  const resolve = useRef<(event: Event) => void>(null);

  function initNdef() {
    if (!supported) {
      throw new Error("NDEFReader not supported in this browser");
    }
    if (!ndefReader.current) {
      const ndef = new NDEFReader();
      function listener(event: Event) {
        const { current } = resolve;
        resolve.current = null;
        current?.(event);
      }
      ndef.addEventListener("reading", listener);
      ndefReader.current = [ndef, new AbortController()];
    }
    return ndefReader.current;
  }

  const {
    refetch: scan,
    data: scanResult,
    error: scanError,
    status: scanStatus,
  } = useQuery({
    queryKey: ["nfc", "scan"],
    async queryFn() {
      const [ndef, abort] = initNdef();
      await ndef.scan(abort);
      const event = await new Promise<Event>((res) => (resolve.current = res));
      abort.abort();
      if (event instanceof NDEFReadingEvent) {
        return event;
      }
      throw new Error(`Unexpected event type: ${event.type}`);
    },
    retry: false,
    enabled: false,
  });

  const { mutate: write, status: writeStatus } = useMutation({
    mutationKey: ["nfc", "write"],
    mutationFn: async (data: NDEFMessageInit) => {
      const [ndef] = initNdef();
      await ndef.write(data);
    },
    onError: (error) => {
      console.error("Failed to write NDEF message:", error);
    },
    retry: false,
  });

  return {
    supported,
    scan,
    scanResult,
    scanError,
    scanStatus,
    write,
    writeStatus,
  };
}
