import clsx from "clsx";
import type { ComponentProps } from "react";

export function Overlay(props: { visible: boolean } & ComponentProps<"div">) {
  const { visible, className, ...rest } = props;

  return (
    <div
      className={clsx(
        "absolute top-0 left-0 min-h-full min-w-full",
        "items-center justify-center",
        "transition-all transition-discrete duration-500",
        "not-data-visible:opacity-0 starting:data-visible:opacity-0 not-data-visible:hidden",
        "data-visible:opacity-100 data-visible:flex",
        className
      )}
      data-visible={visible || undefined}
      {...rest}
    />
  );
}
