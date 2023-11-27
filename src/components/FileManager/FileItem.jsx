import { FaChevronRight } from "react-icons/fa6";
import { HiMiniFolder, HiMiniFolderOpen } from "react-icons/hi2";
import { LuFile, LuFileText } from "react-icons/lu";
import "./FileItem.scss";
import { useState } from "react";
import { useSelector } from "react-redux";

export default function FileItem({
  name,
  type,
  regex,
  on_click,
  on_double_click,
}) {
  const [item_active, set_item_active] = useState(false);
  const is_resizing = useSelector((state) => state.resize.is_resizing);

  const handle_click = () => {
    const new_active = !item_active;
    set_item_active(new_active);
    on_click(name, type, new_active);
  };

  const handle_double_click = () => {
    on_double_click(name, type);
  };

  return (
    <div
      id={is_resizing ? "sidebar_resizing" : ""}
      className={`${item_active ? "item active" : "item"}`}
      onClick={handle_click}
      onDoubleClick={handle_double_click}
    >
      <FaChevronRight
        className={type === "folder" ? "chevron" : "chevron chevron_hidden"}
      />
      {type === "folder" ? (
        item_active ? (
          <HiMiniFolderOpen className="item_icon_folder" />
        ) : (
          <HiMiniFolder className="item_icon_folder" />
        )
      ) : regex.test(name) ? (
        <LuFileText className="item_icon_file" />
      ) : (
        <LuFile className="item_icon_file" />
      )}
      <p className="my_p p_item">{name}</p>
    </div>
  );
}
