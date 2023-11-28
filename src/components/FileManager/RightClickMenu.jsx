import "./RightClickMenu.scss";

export default function RightClickMenu({
  is_visible,
  top,
  left,
  type,
  name,
  regex,
}) {
  const text = () => {
    if (type === "folder") {
      return "go to folder";
    } else {
      if (regex.test(name)) {
        return "open file";
      }
    }
  };

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
      className="context_menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      {text()}
    </div>
  );
}
