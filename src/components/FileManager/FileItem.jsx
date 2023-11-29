import { FaChevronRight } from "react-icons/fa6";
import { GoFile } from "react-icons/go";
import { BsFileEarmark, BsFiletypeMd } from "react-icons/bs";
import { LuFile, LuFileText } from "react-icons/lu";
import { AiFillFolder, AiFillFolderOpen } from "react-icons/ai";
import "./FileItem.scss";
import { useState } from "react";
import { useSelector } from "react-redux";
import RightClickMenu from "./RightClickMenu";

export default function FileItem({
  name,
  type,
  regex,
  on_click,
  on_double_click,
  active_item,
  set_active_item,
}) {
  const [item_active, set_item_active] = useState(false);
  const [menu_position, set_menu_position] = useState({ top: 0, left: 0 });
  const is_resizing = useSelector((state) => state.resize.is_resizing);

  const handle_click = () => {
    const new_active = !item_active;
    set_item_active(new_active);
    on_click(name, type, new_active);
  };

  const handle_double_click = () => {
    on_double_click(name, type);
  };

  const handle_context_menu = (event) => {
    set_menu_position({
      top: event.clientY,
      left: event.clientX,
    });

    set_active_item(name);
  };

  return (
    <>
      <div
        id={is_resizing ? "sidebar_resizing" : ""}
        className={`${item_active ? "item active" : "item"}`}
        onClick={handle_click}
        onDoubleClick={handle_double_click}
        onContextMenu={handle_context_menu}
      >
        <FaChevronRight
          className={type === "folder" ? "chevron" : "chevron chevron_hidden"}
        />
        {type === "folder" ? (
          item_active ? (
            <AiFillFolderOpen className="item_icon_folder" />
          ) : (
            <AiFillFolder className="item_icon_folder" />
          )
        ) : regex.test(name) ? (
          <BsFiletypeMd className="item_icon_file" />
        ) : (
          <BsFileEarmark className="item_icon_file" />
        )}
        <p className="my_p p_item">{name}</p>
      </div>
      {active_item === name &&
      ((type === "file" && regex.test(name)) || type === "folder") ? (
        <RightClickMenu
          top={menu_position.top}
          left={menu_position.left}
          type={type}
          name={name}
          regex={regex}
        />
      ) : (
        ""
      )}
    </>
  );
}
