import "./RightClickMenu.scss";
import { LuFolderSymlink } from "react-icons/lu";
import { BsFileEarmarkText } from "react-icons/bs";

export default function RightClickMenu({ top, left, type, name, regex }) {
  const text = () => {
    if (type === "folder") {
      return "Go to folder";
    } else {
      if (regex.test(name)) {
        return "Open file";
      }
    }
  };

  return (
    <div
      className="context_menu"
      style={{
        top: `${top}px`,
        left: `${left}px`,
      }}
    >
      <div>{text()}</div>
      {type === "folder" ? (
        <LuFolderSymlink className="icon_context_menu" />
      ) : (
        <BsFileEarmarkText className="icon_context_menu" />
      )}
    </div>
  );
}
