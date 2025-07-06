import type { ComponentProps } from "react";
import { clsx } from "clsx/lite";

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={clsx(
        "border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        props.className
      )}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={clsx(
        "border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
        props.className
      )}
    >
      {props.children}
    </select>
  );
}

export function SelectCell(props: ComponentProps<"select">) {
  return (
    <select {...props} className={`${props.className || ""}`}>
      {props.children}
    </select>
  );
}

export function Button(props: ComponentProps<"button">) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={clsx(
        "bg-blue-500 hover:bg-blue-600",
        "text-white rounded-md p-2",
        "focus:outline-none focus:ring-2 focus:ring-blue-500",
        "transition-all duration-300 ease-in-out",
        className
      )}
    />
  );
}

export function IconButton(props: ComponentProps<"button">) {
  const { children, className, ...rest } = props;
  return (
    <button
      {...rest}
      className={clsx(
        "appearance-none cursor-pointer select-none",
        "bg-gray-500 hover:bg-gray-600",
        "text-xs aspect-square rounded-full p-1",
        "text-transparent text-shadow-[0_0_0_white]",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div
        className={clsx(typeof children === "string" && "translate-y-[-5%]")}
      >
        {children}
      </div>
    </button>
  );
}

export function Checkbox(props: ComponentProps<"input"> & { size?: number }) {
  const { size, className, ...rest } = props;

  return (
    <input
      type="checkbox"
      data-size={size}
      {...rest}
      className={clsx(
        // We use a 'data-' attribute to allow dynamic sizing based on a CSS variable
        // This allows us to use the `size` prop to control the size of the checkbox.
        "relative size-[calc(var(--spacing)*attr(data-size_type(<number>),4))]",
        "cursor-pointer disabled:cursor-not-allowed",
        "appearance-none ring-gray-500 ring-2 rounded hover:bg-gray-200",
        "disabled:bg-gray-300 disabled:ring-gray-400",
        "checked:bg-blue-500 checked:ring-blue-500",
        "checked:hover:bg-blue-600 checked:hover:ring-blue-600",
        "transition-all duration-300 ease-in-out",
        "before:transition-all before:duration-300 before:ease-in-out",
        // This forces the checkmark icon to be monochromatic
        "before:content-['✔️'] before:text-transparent before:text-shadow-[0_0_0_white]",
        // This is the size of the checkmark icon. We have to use the data-size attribute
        // because font-size cannot scale to the size of the parent element.
        "before:text-[calc(var(--spacing)*attr(data-size_type(<number>),4)*0.75)]",
        // This positions the checkmark icon in the center of the checkbox
        "before:absolute before:left-[calc(0.5px-3%)] before:top-[calc(0px-16%)]",
        "before:opacity-0 checked:before:opacity-100",
        className
      )}
    />
  );
}

export function CircularProgress(props: ComponentProps<"div">) {
  const { className, ...rest } = props;
  return (
    <div
      {...rest}
      className={clsx(
        "size-4 animate-spin",
        "rounded-full border-4 border-t-transparent border-blue-500",
        "transition-all duration-300 ease-in-out",
        className
      )}
    />
  );
}
