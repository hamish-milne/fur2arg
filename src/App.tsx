import { useRef } from "react";
import DiceBox from "@3d-dice/dice-box";
import Story from "./story.mdx";

function App2() {
  const container = useRef<HTMLDivElement>(null);
  const diceBox = useRef<DiceBox>(null);

  return (
    <div
      id="dice-box-container"
      className="h-full *:h-full *:w-[calc(100%-5px)] relative"
      ref={(x) => {
        if (!x || container.current === x) {
          return;
        }
        container.current = x;
        diceBox.current = new DiceBox({
          assetPath: "/assets/",
          container: "#dice-box-container",
        });
        diceBox.current.init().then(() => {
          diceBox.current?.roll("2d20");
        });
      }}
    >
      <div className="absolute top-0 left-0 h-full w-full flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2 items-center justify-center">
          <button
            className="bg-blue-500 text-white p-2 rounded"
            type="button"
            onClick={() => {
              diceBox.current?.roll("2d20");
            }}
          >
            Roll 2d20
          </button>
          <button
            className="bg-green-500 text-white p-2 rounded"
            type="button"
            onClick={() => {
              diceBox.current?.add("1d6");
            }}
          >
            Add 1d6
          </button>
          <button
            className="bg-red-500 text-white p-2 rounded"
            type="button"
            onClick={() => {
              diceBox.current?.remove(
                diceBox.current?.getRollResults().flatMap((x) => x.rolls)[0]
              );
            }}
          >
            Remove
          </button>
        </div>
        <div className="[&_h1]:text-2xl">
          <Story />
        </div>
      </div>
    </div>
  );
}

export default App2;
