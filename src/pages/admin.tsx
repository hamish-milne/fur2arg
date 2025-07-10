import { set, type Duration, type DurationUnit } from "date-fns";
import {
  api,
  invalidate,
  useApiBulkAction,
  useApiGet,
  type AuthScope,
} from "../hooks";
import { Overlay } from "../components/overlay";
import { intervalToDuration } from "date-fns/intervalToDuration";
import { Table } from "../components/table";
import {
  Button,
  Checkbox,
  Dialog,
  LoadingButton,
  Select,
} from "../components/input";
import { useCallback, useId, useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useScanner } from "../components/scanner";
import {
  useDialogControlled,
  useDialogUncontrolled,
} from "../components/hooks";

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

type ClientForm = { scope?: AuthScope; selected?: string[] };

function Clients(props: { visible: boolean }) {
  const { visible } = props;
  const queryClient = useQueryClient();

  const form = useForm<ClientForm>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { data: clients } = useApiGet(api.clients.all, undefined, {
    enabled: visible,
    // refetchInterval: 5000,
  });

  const { mutate: doUpdate, isPending: updatePending } = useApiBulkAction(
    api.client[":id"],
    "$patch",
    {
      onSuccess() {
        invalidate(queryClient, api.clients.all);
      },
    }
  );
  const { mutate: doDelete, isPending: deletePending } = useApiBulkAction(
    api.client[":id"],
    "$delete"
  );
  const isPending = updatePending || deletePending;

  const selected = form.watch("selected");
  const disabled = !selected || selected.length === 0;

  const labelId = useId();

  return (
    <Table
      rows={clients?.data || []}
      columns={ClientColumns}
      rowKey="id"
      aria-labelledby={labelId}
      caption={useMemo(
        () => (
          <div className="w-full flex items-center gap-2 text-start pl-2">
            <div className="flex-1" id={labelId}>
              Clients
            </div>
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
        ),
        [form, disabled, isPending, labelId]
      )}
      Head={useCallback(
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
                      checked ? clients?.data.map((x) => x.id) || [] : []
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
        [form, clients]
      )}
      Cell={useCallback(
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
      empty="No clients found"
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
      caption="Players"
      Head={({ column }) => {
        switch (column) {
          case "id":
            return "Player ID";
          case "created":
            return "Created";
          case "modified":
            return "Last Modified";
        }
      }}
      Cell={({ row, column }) => {
        switch (column) {
          case "id":
          case "created":
          case "modified":
            return formatDateRelative(row[column]);
        }
      }}
      empty="No players found"
    />
  );
}

export function Admin(props: { visible: boolean }) {
  const { visible } = props;

  const [serialNo, setSerialNo] = useState<string | null>(null);

  const [open, setOpen, dialogRef] = useDialogControlled();
  const { startScan, scanState } = useScanner({
    onScan: useCallback((serialNo) => {
      setSerialNo(serialNo);
      setOpen(true);
    }, []),
  });

  return (
    <Overlay visible={visible} className="">
      <div className="max-w-3xl flex flex-col gap-4 items-center p-2">
        <Clients visible={visible} />
        <Players visible={visible} />
        <LoadingButton
          onClick={() => startScan()}
          loading={scanState === "pending"}
          disabled={["success", "pending", "unavailable"].includes(scanState)}
        >
          Start scanning ({scanState})
        </LoadingButton>
        <LoadingButton onClick={() => setOpen(true)} loading={open}>
          Open Dialog
        </LoadingButton>
      </div>
      <Dialog ref={dialogRef}>
        <p>{serialNo}</p>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Dialog>
    </Overlay>
  );
}
