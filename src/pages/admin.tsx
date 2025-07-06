import type { Duration, DurationUnit } from "date-fns";
import { api, useApiBulkAction, useApiGet, type AuthScope } from "../hooks";
import { Overlay } from "../components/overlay";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { Table } from "../components/table";
import { Checkbox, LoadingButton, Select } from "../components/input";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

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

const ClientColumns = ["select", "id", "scope", "created", "modified"] as const;

function Clients(props: { visible: boolean }) {
  const { visible } = props;

  const form = useForm<{ scope?: AuthScope; selected?: string[] }>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });
  console.log(form.formState);

  const clientsList = useApiGet(api.clients.all, undefined, {
    enabled: visible,
    // refetchInterval: 5000,
  });

  const updateClients = useApiBulkAction(api.client[":id"], "$patch");
  const deleteClients = useApiBulkAction(api.client[":id"], "$delete");
  const isPending = updateClients.isPending || deleteClients.isPending;

  return (
    <Table
      rows={clientsList.data?.data || []}
      columns={ClientColumns}
      rowKey="id"
      Caption={useCallback(() => {
        const selected = form.watch("selected");
        const disabled = selected?.length === 0;
        return (
          <div className="w-full flex items-center gap-2 text-start pl-2">
            <div className="flex-1">Clients</div>
            <Select
              disabled={disabled}
              options={["admin", "room-start"]}
              className="text-base font-normal flex-1 max-w-3xl"
              {...form.register("scope")}
            />
            <LoadingButton
              disabled={disabled}
              loading={isPending}
              className="text-base font-normal"
              onClick={() => {
                console.log(form.getValues().selected?.join(","));
              }}
            >
              Update
            </LoadingButton>
            <LoadingButton
              disabled={disabled}
              className="text-base font-normal bg-red-500 hover:bg-red-600"
            >
              Delete
            </LoadingButton>
          </div>
        );
      }, [form, isPending])}
      head={useCallback(
        ({ column }) => {
          switch (column) {
            case "select":
              return (
                <Checkbox
                  className="flex"
                  onChange={(e) => {
                    const { checked } = e.target;
                    form.setValue(
                      "selected",
                      checked
                        ? clientsList.data?.data.map((x) => x.id) || []
                        : []
                    );
                  }}
                />
              );
            case "id":
              return "Client ID";
            case "scope":
              return "Scope";
            case "created":
              return "Created";
            case "modified":
              return "Last Modified";
          }
        },
        [form, clientsList]
      )}
      cell={useCallback(
        ({ row, column }) => {
          switch (column) {
            case "select":
              // Using 'flex' aligns the checkbox properly in the table cell
              return (
                <Checkbox
                  className="flex"
                  {...form.register("selected")}
                  value={row.id}
                />
              );
            case "id":
            case "scope":
              return row[column];
            case "created":
            case "modified":
              return formatDateRelative(row[column]);
          }
        },
        [form]
      )}
      empty={useCallback(() => "No clients found", [])}
    />
  );
}

function Players(props: { visible: boolean }) {
  const { visible } = props;
  const playersList = useApiGet(api.players.all, undefined, {
    enabled: visible,
    // refetchInterval: 5000,
  });
  return (
    <Table
      rows={playersList.data?.data || []}
      columns={["id", "created", "modified"]}
      rowKey="id"
      Caption={() => "Players"}
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
