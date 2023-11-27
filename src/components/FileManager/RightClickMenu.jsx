import "./RightClickMenu.scss";

export default function RightClickMenu({ is_visible, top, left }) {
  if (!is_visible) return null;

  return (
    <div
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
      className="right_click_menu"
      onContextMenu={(event) => event.preventDefault()}
    >
      go to folder
    </div>
  );
}
