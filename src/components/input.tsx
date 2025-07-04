import type { ComponentProps } from "react";

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={`border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        props.className || ""
      }`}
    />
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={`border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        props.className || ""
      }`}
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
  return (
    <button
      {...props}
      className={`bg-blue-500 hover:bg-blue-600
 text-white rounded-md p-2
focus:outline-none focus:ring-2 focus:ring-blue-500
transition-all duration-300 ease-in-out ${props.className || ""}`}
    >
      {props.children}
    </button>
  );
}

export function IconButton(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`bg-gray-200 hover:bg-gray-300
text-xs text-transparent text-shadow-[0_0_0_white]
rounded-full p-1.5
focus:outline-none focus:ring-2 focus:ring-blue-500 
transition-all duration-300 ease-in-out ${props.className || ""}`}
    >
      <div className="translate-y-[-3%]">{props.children}</div>
    </button>
  );
}
