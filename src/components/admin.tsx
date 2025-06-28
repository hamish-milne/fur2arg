import type { Duration, DurationUnit } from "date-fns";
import { api, useApiAction, useApiGet } from "../hooks";
import { Overlay } from "./overlay";
import { intervalToDuration } from "date-fns/intervalToDuration";

const formatDuration = new Intl.RelativeTimeFormat(window.navigator.language);

const units: DurationUnit[] = [
  "years",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
];

function largestDurationUnit(d: Duration): [DurationUnit, number] | undefined {
  for (const unit of units) {
    if (d[unit] && d[unit] !== 0) {
      return [unit, d[unit]];
    }
  }
  return undefined;
}

function formatDateRelative(date: string) {
  const d = intervalToDuration({ end: date, start: new Date() });
  const [unit, value] = largestDurationUnit(d) || ["seconds", 0];
  return formatDuration.format(value, unit);
}

export function Admin(props: { visible: boolean }) {
  const { visible } = props;

  const clientsList = useApiGet(api.clients.all, undefined, {
    enabled: visible,
    refetchInterval: 5000,
  });
  const playersList = useApiGet(api.players.all, undefined, {
    enabled: visible,
    refetchInterval: 5000,
  });

  const addClient = useApiAction(api.client[":id"].$patch, "new-client");

  return (
    <Overlay visible={visible}>
      <div className="max-w-3xl bg-amber-50">
        <table className="table-auto border-collapse border border-amber-900 [&_th,_td]:border [&_th,_td]:border-amber-900 [&_th,_td]:px-4 [&_th,_td]:py-2">
          <caption className="text-lg font-semibold mb-2">Clients</caption>
          <thead className="bg-amber-200">
            <tr className="">
              <th>Client ID</th>
              <th>Scope</th>
              <th>Created At</th>
              <th>Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {clientsList.data?.data.map((client) => (
              <tr key={client.id} className="hover:bg-amber-100">
                <td>{client.id}</td>
                <td>{client.scope}</td>
                <td>{formatDateRelative(client.createdAt)}</td>
                <td>{formatDateRelative(client.lastModified)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Overlay>
  );
}
