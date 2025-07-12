import { useId } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";
import { Checkbox } from "../components/input";
import { Table } from "../components/table";
import { api, useApiGet } from "../hooks";
import {
  CheckboxSelectAll,
  formatDateRelative,
  normalizeCheckboxArray,
  UpdateButton,
  type AdminForm,
} from "./admin";

function PlayersHeader(props: { form: UseFormReturn<AdminForm> }) {
  const { form } = props;
  const players = useWatch({
    control: form.control,
    name: "players",
  });
  const selectedArray = normalizeCheckboxArray(players);
  return (
    <>
      <UpdateButton
        formObj={form}
        resetField="players"
        disabled={selectedArray.length === 0}
        mutation={api.player[":id"]}
        method="$delete"
        toInvalidate={api.players.all}
        dialogContent={
          <p>
            Are you sure you want to delete{" "}
            {selectedArray.length === 1
              ? selectedArray[0]
              : `${selectedArray.length} players`}
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

export function Players(props: {
  visible: boolean;
  form: UseFormReturn<AdminForm>;
}) {
  const { visible, form } = props;
  const { data: { data: playersList } = { data: [] } } = useApiGet(
    api.players.all,
    undefined,
    {
      enabled: visible,
      refetchInterval: 5000,
    }
  );
  const labelId = useId();
  return (
    <Table
      rows={playersList}
      columns={["select", "id", "created", "modified"]}
      rowKey="id"
      caption={
        <div className="w-full flex items-center gap-2 text-start pl-2">
          <div className="flex-1" id={labelId}>
            Players
          </div>
          <PlayersHeader form={form} />
        </div>
      }
      Head={({ column }) => {
        switch (column) {
          case "select":
            return (
              <CheckboxSelectAll
                formObj={form}
                fieldName="players"
                label="Select all players"
                allIds={playersList.map((x) => x.id)}
              />
            );
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
          case "select":
            return (
              <Checkbox
                className="flex"
                {...form.register("players")}
                value={row.id}
              />
            );
          case "id":
            return row[column];
          case "created":
          case "modified":
            return formatDateRelative(row[column]);
        }
      }}
      empty="No players found"
    />
  );
}
