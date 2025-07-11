import { api, useApiGet } from "../hooks";

export function RoomStart(props: { playerId: string }) {
  const { playerId } = props;

  const playerQuery = useApiGet(
    api.player[":id"].register,
    { id: playerId },
    {
      enabled: Boolean(playerId),
    }
  );
  const { data: playerData } = playerQuery;

  return (
    <div className="text-2xl">
      <h1>Room Start</h1>
      <p>Player ID: {playerId}</p>
      {playerData ? (
        "error" in playerData ? (
          <p>Error: {playerData.error}</p>
        ) : (
          <>
            <p>Player registered successfully!</p>
            <p>Player Data: {JSON.stringify(playerData.data)}</p>
          </>
        )
      ) : null}
    </div>
  );
}
