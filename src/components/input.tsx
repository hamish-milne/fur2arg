import type { ReactNode, ComponentProps } from "react";
import { clsx } from "clsx/lite";

export function Input(props: ComponentProps<"input">) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={clsx("border border-gray-300 rounded-md p-2", className)}
    />
  );
}

const focusStyles =
  "outline-2 outline-transparent focus-visible:outline-gray-800";

const optionStyles =
  "[&::checkmark]:hidden px-2 hover:bg-gray-200 transition-all";

export const isMobileDevice = /Mobi/i.test(window.navigator.userAgent);

export function Select<T extends string>(
  props: Omit<ComponentProps<"select">, "children"> & {
    options: (T | { label: string; options: T[] })[];
    Option?:
      | "option"
      | ((props: {
          value: T;
          className: string;
          children: ReactNode;
        }) => ReactNode);
    OptionGroup?:
      | "optgroup"
      | ((props: {
          label: string;
          className: string;
          children: ReactNode;
        }) => ReactNode);
  }
) {
  const {
    options,
    Option = "option",
    OptionGroup = "optgroup",
    className,
    ...rest
  } = props;
  return (
    <select
      {...rest}
      className={clsx(
        "px-2 py-1 border border-gray-300 rounded-md [&:is(:hover,:open):not(:disabled)]:bg-gray-100 transition-all",
        "disabled:bg-gray-200 disabled:text-gray-400 not-open:cursor-pointer disabled:cursor-not-allowed",
        // See https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select
        // For unsupported browsers this will fall back to the default select appearance
        "[appearance:base-select]",
        // For mobile devices, we use the native picker
        !isMobileDevice && "[&::picker(select)]:[appearance:base-select]",
        // Draw the picker icon
        "[&::picker-icon]:[content:'▼'] [&::picker-icon]:text-xs [&::picker-icon]:flex [&::picker-icon]:items-center [&::picker-icon]:text-gray-600",
        // Rotate the picker icon when the select is open
        "[&::picker-icon]:transition-all [&::picker-icon]:duration-300 [&:open::picker-icon]:rotate-180",
        // Default picker styles
        "[&::picker(select)]:mt-1 [&::picker(select)]:rounded-md [&::picker(select)]:border [&::picker(select)]:border-gray-300",
        // Popover transition for the picker. Note that this requires the `@starting-style` defined in index.css
        "[&::picker(select)]:opacity-0 starting:open:[&::picker(select)]:opacity-0 open:[&::picker(select)]:opacity-100 [&::picker(select)]:transition-all [&::picker(select)]:transition-discrete",
        focusStyles,
        className
      )}
    >
      {options.map((option, index) => {
        if (typeof option === "string") {
          return (
            <Option key={option} value={option} className={optionStyles}>
              {option}
            </Option>
          );
        }
        if (typeof option === "object") {
          return (
            <OptionGroup
              // biome-ignore lint/suspicious/noArrayIndexKey: There's no better way to identify option groups here
              key={index}
              className={"font-semibold"}
              label={option.label}
            >
              {option.options.map((subOption) => (
                <Option
                  key={subOption}
                  value={subOption}
                  className={clsx(optionStyles, "pl-4")}
                >
                  {subOption}
                </Option>
              ))}
            </OptionGroup>
          );
        }
        return null;
      })}
    </select>
  );
}

export function Button(props: ComponentProps<"button">) {
  const { className, ...rest } = props;
  return (
    <button
      {...rest}
      className={clsx(
        "appearance-none cursor-pointer disabled:cursor-not-allowed",
        "bg-blue-500 hover:bg-blue-600",
        "disabled:bg-gray-300",
        "text-white rounded-md px-2 py-1",
        "transition-all",
        focusStyles,
        className
      )}
    />
  );
}

export function LoadingButton(
  props: ComponentProps<"button"> & { loading?: boolean }
) {
  const { className, loading = false, ...rest } = props;
  return (
    <Button
      {...rest}
      data-loading={loading || undefined}
      className={clsx(
        // The spinner's default appearance:
        "before:h-5 before:border-3 before:border-white",
        // Make the spinner round, 3/4 of a full circle, and spin:
        "before:rounded-full before:border-t-transparent before:animate-spin",
        // Position the spinner in the center of the button:
        "relative before:inline-block before:absolute before:aspect-square",
        "before:top-1/2 before:left-1/2 before:-translate-1/2",
        // Make the spinner invisible when not loading:
        "before:transition-all before:duration-300",
        "data-loading:text-transparent not-data-loading:before:h-0 not-data-loading:before:opacity-0",
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
        "transition-all",
        focusStyles,
        className
      )}
    >
      <div
        className={clsx(
          typeof children === "string" && "translate-y-[calc(0px-5%)]"
        )}
      >
        {children}
      </div>
    </button>
  );
}

declare module "react" {
  interface CSSProperties {
    "--checkbox-size"?: string;
  }
}

export function Checkbox(props: ComponentProps<"input"> & { size?: number }) {
  const { size = 16, className, style, ...rest } = props;

  return (
    <input
      type="checkbox"
      {...rest}
      style={{
        ...style,
        // We use a CSS variable to control the size of the checkbox
        // This allows us to use the `size` prop to control the size of the checkbox.
        "--checkbox-size": `${size}px`,
      }}
      className={clsx(
        "relative size-(--checkbox-size)",
        "cursor-pointer disabled:cursor-not-allowed",
        "appearance-none ring-gray-500 ring-2 rounded hover:bg-gray-200",
        "disabled:bg-gray-300 disabled:ring-gray-400",
        "checked:bg-blue-500 checked:ring-blue-500",
        "checked:hover:bg-blue-600 checked:hover:ring-blue-600",
        "transition-all before:transition-all outline-offset-1",
        // This forces the checkmark icon to be monochromatic
        "font-serif before:content-['✔'] before:font-bold before:text-transparent before:text-shadow-[0_0_0_white]",
        // This is the size of the checkmark icon. We have to use the --checkbox-size variable
        // because font-size cannot scale to the size of the parent element.
        "before:text-(--checkbox-size)",
        // This positions the checkmark icon in the center of the checkbox
        "before:absolute before:m-[-20%_10%]",
        "before:opacity-0 checked:before:opacity-100",
        focusStyles,
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
        "size-4 animate-spin transition-all",
        "rounded-full border-4 border-t-transparent border-blue-500",
        className
      )}
    />
  );
}

export function Dialog(props: ComponentProps<"dialog">) {
  const { className, ...rest } = props;
  return (
    <dialog
      {...rest}
      className={clsx(
        "not-open:hidden fixed top-1/2 left-1/2 -translate-1/2",
        "bg-white rounded-lg shadow-lg p-4",
        "border border-gray-300",
        "backdrop:bg-gray-500/50",
        "transition-all transition-discrete duration-300",
        "backdrop:transition-all backdrop:transition-discrete backdrop:duration-300",
        "backdrop:opacity-0 opacity-0 translate-y-4",
        "starting:open:backdrop:opacity-0 starting:open:opacity-0 starting:open:translate-y-4",
        "open:backdrop:opacity-100 open:opacity-100 open:translate-y-0",
        className
      )}
    />
  );
}

export function Toast(props: ComponentProps<"dialog">) {
  const { className, ...rest } = props;
  return (
    <dialog
      {...rest}
      className={clsx(
        "fixed bottom-4 right-4",
        "bg-white rounded-lg shadow-lg p-4",
        "border border-gray-300",
        "transition-all transition-discrete duration-300",
        "opacity-0 translate-y-4",
        "starting:open:opacity-0 starting:open:translate-y-4",
        "open:opacity-100 open:translate-y-0",
        className
      )}
    />
  );
}
