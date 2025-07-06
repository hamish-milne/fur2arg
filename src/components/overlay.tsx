import type { ComponentProps } from "react";

export function Overlay(props: { visible: boolean } & ComponentProps<"div">) {
  const { visible, ...divProps } = props;

  return (
    <div
      className="absolute top-0 left-0 min-h-full min-w-full flex items-center justify-center data-[visible=false]:opacity-0 transition-opacity duration-500 overflow-scroll"
      data-visible={visible}
      {...divProps}
    />
  );
}
