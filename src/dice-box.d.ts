declare module "@3d-dice/dice-box" {
  export type RollSpec = string | Roll | (string | Roll)[];

  export interface Roll {
    modifier?: number;
    qty: number;
    sides: number | string;
    theme?: string;
    themeColor?: string;
  }

  export interface DieResult {
    groupId: number;
    rollId: number;
    sides: number | string;
    theme: string;
    themeColor: string;
    value: number;
  }

  export interface GroupResult {
    id: number;
    mods: number[];
    rolls: DieResult[];
    sides: number | string;
    theme: string;
    themeColor: string;
    value: number;
  }

  export interface ThemeConfig {
    name: string;
    systemName: string;
    extends?: string;
    author?: string;
    version?: string;
    thumbnail?: string;
    meshFile?: string;
    diceAvailable: string[];
    material: {
      type: string;
      diffuseTexture: string | { light: string; dark: string };
      diffuseLevel?: number;
      bumpTexture?: string;
      bumpLevel?: number;
      specularTexture?: string;
      specularLevel?: number;
    };
    themeColor?: string;
    d4FaceDown?: boolean;
  }

  export interface DiceBoxOptions {
    id?: string;
    assetPath: string;
    container?: string;
    gravity?: number;
    mass?: number;
    friction?: number;
    restitution?: number;
    angularDamping?: number;
    linearDamping?: number;
    spinForce?: number;
    throwForce?: number;
    startingHeight?: number;
    settleTimeout?: number;
    offscreen?: boolean;
    delay?: number;
    lightIntensity?: number;
    enableShadows?: boolean;
    shadowTransparency?: number;
    theme?: string;
    preloadThemes?: string[];
    externalThemes?: Record<string, string>;
    themeColor?: string;
    scale?: number;
    suspendSimulation?: boolean;
    origin?: string;
    onBeforeRoll?: (this: DiceBox) => void;
    onDieComplete?: (this: DiceBox) => void;
    onRollComplete?: (this: DiceBox) => void;
    onRemoveComplete?: (this: DiceBox) => void;
    onThemeConfigLoaded?: (this: DiceBox, theme: string) => void;
    onThemeLoaded?: (this: DiceBox, theme: string) => void;
  }

  export interface RollOptions {
    theme?: string;
    newStartPoint?: boolean;
  }

  export interface RollId {
    groupId: number;
    rollId: number;
  }

  class DiceBox {
    constructor(options: DiceBoxOptions);
    init(): Promise<void>;
    roll(rollSpec: RollSpec, options?: RollOptions): Promise<DieResult[]>;
    add(rollSpec: RollSpec, options?: RollOptions): Promise<DieResult[]>;
    reroll(
      rollId: RollId | RollId[],
      options?: RollOptions,
    ): Promise<DieResult[]>;
    remove(rollId: RollId | RollId[]): Promise<DieResult[]>;
    clear(): void;
    hide(className?: string): void;
    show(): void;
    getRollResults(): GroupResult[];
    updateConfig(options: Partial<DiceBoxOptions>): void;
  }

  export default DiceBox;
}
