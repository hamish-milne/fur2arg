function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function ndefToGuid(event: NDEFReadingEvent): string {
  const {
    message: {
      records: [record],
    },
    serialNumber,
  } = event;
  const array = new Uint8Array(16);
  const snBytes = fromHex(serialNumber.replaceAll(":", ""));
  if (snBytes.length !== 4) {
    throw new Error("Invalid serial number length");
  }
  array.set(snBytes, 0);
  if (!record || record.recordType !== "text" || !record.data) {
    throw new Error("Invalid NDEF record type");
  }
  const { data } = record;
  if (data.byteLength !== 12) {
    throw new Error("Invalid NDEF record data length");
  }
  array.set(new Uint8Array(data.buffer), 4);
  const raw = toHex(array);
  // Insert dashes to format as GUID
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

export function randomNdef(): NDEFMessageInit {
  return {
    records: [
      {
        recordType: "text",
        data: crypto.getRandomValues(new Uint8Array(12)),
      },
    ],
  };
}
