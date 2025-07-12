import { useId } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";
import { Checkbox, Select } from "../components/input";
import { Table } from "../components/table";
import { api, useApiGet } from "../hooks";
import {
  type AdminForm,
  CheckboxSelectAll,
  formatDateRelative,
  normalizeCheckboxArray,
  UpdateButton,
} from "./admin";

function ClientsHeader(props: { form: UseFormReturn<AdminForm> }) {
  const { form } = props;
  const [clients, scope] = useWatch({
    control: form.control,
    name: ["clients", "scope"],
  });
  const selectedArray = normalizeCheckboxArray(clients);
  return (
    <>
      <Select
        disabled={selectedArray.length === 0}
        options={["admin", "room-start"]}
        className="text-base font-normal flex-1 max-w-3xl"
        {...form.register("scope")}
      />
      <UpdateButton
        formObj={form}
        resetField="clients"
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
      <UpdateButton
        formObj={form}
        resetField="clients"
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
    </>
  );
}

export function Clients(props: {
  visible: boolean;
  form: UseFormReturn<AdminForm>;
}) {
  const { visible, form } = props;

  const { data: { data: clientsList } = { data: [] } } = useApiGet(
    api.clients.all,
    undefined,
    {
      enabled: visible,
      refetchInterval: 5000,
    }
  );

  const labelId = useId();

  return (
    <Table
      rows={clientsList}
      columns={["select", "id", "scope", "created", "modified"]}
      rowKey="id"
      aria-labelledby={labelId}
      caption={
        <div className="w-full flex items-center gap-2 text-start pl-2">
          <div className="flex-1" id={labelId}>
            Clients
          </div>
          <ClientsHeader form={form} />
        </div>
      }
      Head={({ column }) => {
        switch (column) {
          case "select":
            return (
              <CheckboxSelectAll
                formObj={form}
                fieldName="clients"
                label="Select all clients"
                allIds={clientsList.map((x) => x.id)}
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
      }}
      Cell={({ row, column }) => {
        switch (column) {
          case "select":
            return (
              <Checkbox
                className="flex"
                {...form.register("clients")}
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
      }}
      empty="No clients found"
    />
  );
}
