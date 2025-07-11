import { useState } from "react";
import { useScanner } from "../components/scanner";
import type { AuthScope } from "../hooks";
import { LoadingButton } from "../components/input";
import { RoomStart } from "./room-start";
import { Overlay } from "../components/overlay";

export function RoomWrapper(props: { scope: AuthScope | null }) {
  const { scope } = props;
  const [playerId, setPlayerId] = useState("");
  const { startScan, scanState } = useScanner({
    onScan(serialNo) {
      setPlayerId(serialNo.replaceAll(":", "").substring(0, 6).toUpperCase());
    },
  });
  const loading = scanState === "pending";

  return (
    <>
      <Overlay visible={scanState === "unavailable"} className="text-2xl">
        Your device does not support WebNFC. Please use a different device.
      </Overlay>
      <Overlay
        visible={["idle", "pending", "error"].includes(scanState)}
        className="text-2xl"
      >
        <LoadingButton
          loading={loading}
          disabled={loading}
          onClick={() => startScan()}
          className="text-2xl"
        >
          Enable NFC
        </LoadingButton>
      </Overlay>
      <Overlay
        visible={scanState === "success" && scope === "room-start"}
        className="text-2xl"
      >
        <RoomStart playerId={playerId} />
      </Overlay>
    </>
  );
}
