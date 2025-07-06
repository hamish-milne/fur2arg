import type { Duration, DurationUnit } from "date-fns";
import { api, useApiAction, useApiGet } from "../hooks";
import { Overlay } from "../components/overlay";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { Table } from "../components/table";
import {
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
} from "../components/input";

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

function Clients(props: { visible: boolean }) {
  const { visible } = props;

  const clientsList = useApiGet(api.clients.all, undefined, {
    enabled: visible,
    refetchInterval: 5000,
  });

  return (
    <Table
      rows={clientsList.data?.data || []}
      columns={["select", "id", "scope", "created", "modified", "actions"]}
      rowKey="id"
      caption="Clients"
      head={({ column }) => {
        switch (column) {
          case "select":
            return "";
          case "id":
            return "Client ID";
          case "scope":
            return "Scope";
          case "created":
            return "Created";
          case "modified":
            return "Last Modified";
          case "actions":
            return "Actions";
        }
      }}
      cell={({ row, column }) => {
        switch (column) {
          case "select":
            return <Checkbox />;
          case "id":
          case "scope":
            return row[column];
          case "created":
          case "modified":
            return formatDateRelative(row[column]);
          case "actions":
            return <ClientActions id={row.id} />;
        }
      }}
      empty={() => "No clients found"}
    />
  );
}

function Players(props: { visible: boolean }) {
  const { visible } = props;
  const playersList = useApiGet(api.players.all, undefined, {
    enabled: visible,
    refetchInterval: 5000,
  });
  return (
    <Table
      rows={playersList.data?.data || []}
      columns={["id", "created", "modified"]}
      rowKey="id"
      caption="Players"
      head={({ column }) => {
        switch (column) {
          case "id":
            return "Player ID";
          case "created":
            return "Created";
          case "modified":
            return "Last Modified";
        }
      }}
      cell={({ row, column }) => {
        switch (column) {
          case "id":
          case "created":
          case "modified":
            return formatDateRelative(row[column]);
        }
      }}
      empty={() => "No players found"}
    />
  );
}

export function Admin(props: { visible: boolean }) {
  const { visible } = props;

  return (
    <Overlay visible={visible}>
      <div className="max-w-3xl flex flex-col gap-4 items-center">
        <Clients visible={visible} />
        <Players visible={visible} />
      </div>
    </Overlay>
  );
}

function ClientActions(props: { id: string }) {
  const { id } = props;

  const deleteClient = useApiAction(api.client[":id"], "$delete", { id });
  //  ❌
  return (
    <IconButton
      onClick={() => deleteClient.mutate()}
      className="bg-red-500 hover:bg-red-600"
    >
      ❌
    </IconButton>
  );
}
