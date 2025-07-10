import clsx from "clsx";
import { useId, type ComponentProps, type ReactNode } from "react";

export function Table<TRow, TCol extends string>(
  props: {
    rowKey: keyof TRow;
    rows: readonly TRow[];
    columns: readonly [TCol, ...TCol[]];
    Head(props: { column: TCol }): ReactNode;
    Cell(props: { row: TRow; column: TCol }): ReactNode;
    empty: ReactNode;
    caption?: ReactNode;
  } & ComponentProps<"table">
) {
  const {
    rowKey,
    rows,
    columns,
    Head,
    Cell,
    empty,
    caption,
    className,
    ...rest
  } = props;

  return (
    <table
      {...rest}
      className={clsx(
        "table-auto border-collapse border border-gray-300",
        className
      )}
    >
      {caption && (
        <caption className="text-lg font-semibold mb-2 caption-top">
          {caption}
        </caption>
      )}
      <thead className="bg-gray-200">
        <tr>
          {columns.map((column) => (
            <th key={String(column)} className="px-4 py-2">
              <Head column={column} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={String(row[rowKey])}
            className="hover:bg-gray-100 transition-all"
          >
            {columns.map((column) => (
              <td key={String(column)} className="px-4 py-2">
                <Cell row={row} column={column} />
              </td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-2 text-center text-gray-500"
            >
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
