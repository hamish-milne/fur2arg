import { useQueryClient } from "@tanstack/react-query";
import type { Duration, DurationUnit } from "date-fns";
import { intervalToDuration } from "date-fns/intervalToDuration";
import type { ComponentProps, ReactNode } from "react";
import { type UseFormReturn, useForm, useWatch } from "react-hook-form";
import {
  useCheckboxIndeterminate,
  useDialogControlled,
} from "../components/hooks";
import { Button, Checkbox, Dialog, LoadingButton } from "../components/input";
import { Overlay } from "../components/overlay";
import {
  type AnyRoute,
  type AuthScope,
  type BulkData,
  invalidate,
  type Method,
  type Route,
  useApiBulkAction,
} from "../hooks";
import { Clients } from "./admin-clients";
import { Players } from "./admin-players";

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

export function formatDateRelative(date: string) {
  const d = intervalToDuration({ end: date, start: new Date() });
  const [unit, value] = largestDurationUnit(d) || ["seconds", 0];
  return formatDuration.format(value, unit);
}

type MultiCheckbox<T extends string> = T[] | T | boolean | null | undefined;

export type AdminForm = {
  scope?: AuthScope;
  clients: MultiCheckbox<string>;
  players: MultiCheckbox<string>;
};

export function normalizeCheckboxArray<T extends string>(
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

export function UpdateButton<
  TMethod extends Method,
  TRoute extends Route<TMethod>
>(
  props: {
    formObj: UseFormReturn<AdminForm>;
    disabled?: boolean;
    mutation: TRoute;
    method: TMethod;
    toInvalidate: AnyRoute;
    getData: () => BulkData<TMethod, TRoute>;
    dialogContent: ReactNode;
    resetField: keyof AdminForm;
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
    resetField,
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
      formObj.resetField(resetField);
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

export function CheckboxSelectAll(props: {
  formObj: UseFormReturn<AdminForm>;
  fieldName: "clients" | "players";
  label: string;
  allIds: string[] | undefined;
}) {
  const { formObj, fieldName, label, allIds = [] } = props;
  const selected = useWatch({
    control: formObj.control,
    name: fieldName,
  });
  const selectedArray = normalizeCheckboxArray(selected);
  const ref = useCheckboxIndeterminate(
    selectedArray.length > 0 && selectedArray.length < allIds.length
  );
  return (
    <Checkbox
      ref={ref}
      aria-label={label}
      // Using 'flex' aligns the checkbox properly in the table cell
      className="flex"
      disabled={allIds.length === 0}
      onChange={(e) => {
        const { checked } = e.target;
        formObj.setValue(fieldName, checked ? allIds : []);
      }}
      checked={selectedArray.length > 0}
    />
  );
}

export function Admin(props: { visible: boolean }) {
  const { visible } = props;

  const form = useForm<AdminForm>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  return (
    <Overlay visible={visible} className="">
      <div className="max-w-3xl flex flex-col gap-4 items-center p-2">
        <Clients visible={visible} form={form} />
        <Players visible={visible} form={form} />
      </div>
    </Overlay>
  );
}
