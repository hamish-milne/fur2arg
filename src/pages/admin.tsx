import type { Duration, DurationUnit } from "date-fns";
import {
  api,
  invalidate,
  useApiBulkAction,
  useApiGet,
  type AnyRoute,
  type AuthScope,
  type BulkData,
  type Method,
  type Route,
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
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useScanner } from "../components/scanner";
import { useDialogControlled } from "../components/hooks";

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

type ClientForm = { scope?: AuthScope; selected?: string[] | string | boolean };

function normalizeCheckboxArray<T extends string>(
  value: T[] | T | boolean | null | undefined
): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "string") {
    return [value];
  }
  return [];
}

function UpdateClientsButton(props: { form: UseFormReturn<ClientForm> }) {
  const { form } = props;
  const { selected, scope } = useWatch({
    control: form.control,
  });
  const selectedArray = normalizeCheckboxArray(selected);

  return (
    <UpdateButton
      formObj={form}
      disabled={selectedArray.length === 0 || !scope}
      mutation={api.client[":id"]}
      method="$patch"
      toInvalidate={api.clients.all}
      dialogContent={
        <p>
          Assign{" "}
          {selectedArray.length === 1
            ? selectedArray[0]
            : `${selectedArray.length} clients`}{" "}
          to the <strong>{scope}</strong> scope?
        </p>
      }
      getData={() =>
        scope
          ? selectedArray.map((id) => ({
              param: { id },
              json: { scope },
            }))
          : []
      }
      className="text-base font-normal"
    >
      Update
    </UpdateButton>
  );
}

function DeleteClientsButton(props: { form: UseFormReturn<ClientForm> }) {
  const { form } = props;
  const { selected } = useWatch({
    control: form.control,
  });
  const selectedArray = normalizeCheckboxArray(selected);

  return (
    <UpdateButton
      formObj={form}
      disabled={selectedArray.length === 0}
      mutation={api.client[":id"]}
      method="$delete"
      toInvalidate={api.clients.all}
      dialogContent={
        <p>
          Are you sure you want to delete{" "}
          {selectedArray.length === 1
            ? selectedArray[0]
            : `${selectedArray.length} clients`}
          ?
        </p>
      }
      getData={() =>
        selectedArray.map((id) => ({
          param: { id },
          json: undefined,
        }))
      }
      className="text-base font-normal bg-red-500 hover:bg-red-600"
    >
      Delete
    </UpdateButton>
  );
}

function UpdateButton<TMethod extends Method, TRoute extends Route<TMethod>>(
  props: {
    formObj: UseFormReturn<ClientForm>;
    disabled?: boolean;
    mutation: TRoute;
    method: TMethod;
    toInvalidate: AnyRoute;
    getData: () => BulkData<TMethod, TRoute>;
    dialogContent: ReactNode;
  } & ComponentProps<typeof Button>
) {
  const {
    formObj,
    disabled,
    mutation,
    method,
    toInvalidate,
    getData,
    dialogContent,
    ...rest
  } = props;
  const queryClient = useQueryClient();
  const [_open, setOpen, dialogProps] = useDialogControlled();
  const { mutate, isPending } = useApiBulkAction(mutation, method, {
    onSuccess() {
      invalidate(queryClient, toInvalidate);
    },
    onSettled() {
      setOpen(false);
      formObj.resetField("selected");
    },
    onError(error) {
      console.error(error);
    },
  });

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)} {...rest} />

      <Dialog
        className="text-base font-normal flex flex-col gap-2"
        {...dialogProps}
      >
        {dialogContent}
        <div className="flex items-stretch justify-end gap-2 w-full">
          <LoadingButton
            disabled={disabled || isPending}
            loading={isPending}
            onClick={() => {
              if (disabled) {
                return;
              }
              mutate(getData());
            }}
          >
            Apply
          </LoadingButton>
          <Button
            onClick={() => setOpen(false)}
            className="bg-white hover:bg-white text-red-500! inset-ring-1 inset-ring-red-500 hover:inset-ring-2"
          >
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function Clients(props: { visible: boolean }) {
  const { visible } = props;

  const form = useForm<ClientForm>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { data: clients } = useApiGet(api.clients.all, undefined, {
    enabled: visible,
    refetchInterval: 5000,
  });

  const { mutate: doDelete, isPending: deletePending } = useApiBulkAction(
    api.client[":id"],
    "$delete"
  );
  const isPending = deletePending;

  const { selected, scope } = form.watch();
  const selectedArray = normalizeCheckboxArray(selected);
  const disabled = selectedArray.length === 0;

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

            <UpdateClientsButton form={form} />
            <DeleteClientsButton form={form} />
          </div>
        ),
        [form, disabled, labelId]
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

  const [open, setOpen, dialogProps] = useDialogControlled();
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
          Start scanning
        </LoadingButton>
      </div>
      <Dialog {...dialogProps}>
        <p>{serialNo}</p>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Dialog>
    </Overlay>
  );
}
