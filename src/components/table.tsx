import type { ReactNode } from "react";

export function Table<TRow, TCol extends string>(props: {
  rowKey: keyof TRow;
  rows: readonly TRow[];
  columns: readonly [TCol, ...TCol[]];
  Caption?: () => ReactNode;
  head(props: { column: TCol }): ReactNode;
  cell(props: { row: TRow; column: TCol }): ReactNode;
  empty(): ReactNode;
}) {
  const { rowKey, rows, columns, Caption, head, cell, empty } = props;

  return (
    <table className="table-auto border-collapse border border-gray-300">
      {Caption && (
        <caption className="text-lg font-semibold mb-2 caption-top">
          <Caption />
        </caption>
      )}
      <thead className="bg-gray-200">
        <tr>
          {columns.map((column) => (
            <th key={String(column)} className="px-4 py-2">
              {head({ column })}
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
                {cell({ row, column })}
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
              {empty()}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
