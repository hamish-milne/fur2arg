import { useApiGet } from "../hooks";
import { useEffect } from "react";

export function Register(props: { code: string; visible: boolean }) {
  const { code, visible } = props;
  return (
    <div
      className="h-full flex items-center justify-center data-[visible=false]:opacity-0 transition-opacity duration-500"
      data-visible={visible}
    >
      <div className="text-9xl">{code}</div>
    </div>
  );
}
