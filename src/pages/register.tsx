import { Overlay } from "../components/overlay";

export function Register(props: { code: string; visible: boolean }) {
  const { code, visible } = props;
  return (
    <Overlay visible={visible}>
      <div className="text-9xl">{code}</div>
    </Overlay>
  );
}
