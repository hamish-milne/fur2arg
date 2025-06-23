export function Admin(props: { visible: boolean }) {
  const { visible } = props;

  return (
    <div
      className="h-full flex flex-col data-[visible=false]:opacity-0 transition-opacity duration-500"
      data-visible={visible}
    >
      <div className="text-9xl">Admin Panel</div>
    </div>
  );
}
