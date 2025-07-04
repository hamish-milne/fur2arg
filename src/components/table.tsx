export function Table<TRow, TCol extends string>(props: {
  rowKey: keyof TRow;
  rows: TRow[];
  columns: [TCol, ...TCol[]];
  caption?: string;
  head(props: { column: TCol }): React.ReactNode;
  cell(props: { row: TRow; column: TCol }): React.ReactNode;
  empty(): React.ReactNode;
}) {
  const { rowKey, rows, columns, caption, head, cell, empty } = props;

  return (
    <table className="table-auto border-collapse border border-gray-300">
      {caption && (
        <caption className="text-lg font-semibold mb-2">{caption}</caption>
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
            className="hover:bg-gray-100 transition-all duration-200 ease-in-out"
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
