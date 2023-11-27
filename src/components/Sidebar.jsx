import { useEffect, useRef, useState } from "react";
import "./Sidebar.scss";
import FileList from "./FileManager/FileList";
import { useDispatch, useSelector } from "react-redux";
import { resizing } from "../state/ResizingSlice";

export default function Sidebar({ explorer_opened, sidebar_content_visible }) {
  const sidebar_ref = useRef(null);
  const filemanager_ref = useRef(null);
  const resize_handle_ref = useRef(null);
  const [sidebar_width, set_sidebar_width] = useState(0);
  const [class_names, set_class_names] = useState("file_manager");

  const dispatch = useDispatch();
  const is_content_loaded = useSelector((state) => state.content.is_loaded);
  const is_resizing = useSelector((state) => state.resize.is_resizing);

  useEffect(() => {
    if (explorer_opened) {
      set_sidebar_width(270);
    } else {
      set_sidebar_width(0);
    }
  }, [explorer_opened]);

  useEffect(() => {
    if (is_content_loaded) {
      filemanager_ref.current.style.height = "fit-content";
    }
  }, [is_content_loaded]);

  const handle_mouse_down = (e) => {
    e.preventDefault();
    dispatch(resizing(true));
  };

  const handle_mouse_move = (e) => {
    if (is_resizing) {
      const new_width = Math.min(Math.max(e.clientX, 270), 550);
      set_sidebar_width(new_width);
    }
  };

  const handle_mouse_up = () => {
    dispatch(resizing(false));
  };

  useEffect(() => {
    if (is_resizing) {
      document.addEventListener("mousemove", handle_mouse_move);
      document.addEventListener("mouseup", handle_mouse_up);

      resize_handle_ref.current.classList.add("handle_visible");
    } else {
      document.removeEventListener("mousemove", handle_mouse_move);
      document.removeEventListener("mouseup", handle_mouse_up);

      resize_handle_ref.current.classList.remove("handle_visible");
    }
    return () => {
      document.removeEventListener("mousemove", handle_mouse_move);
      document.removeEventListener("mouseup", handle_mouse_up);
    };
  }, [is_resizing]);

  useEffect(() => {
    sidebar_content_visible
      ? set_class_names("file_manager file_manager_visible")
      : set_class_names("file_manager");
  }, [sidebar_content_visible]);

  return (
    <div
      className="sidebar sidebar_toggled"
      style={{ width: sidebar_width }}
      ref={sidebar_ref}
    >
      <div
        className={class_names}
        ref={filemanager_ref}
      >
        <FileList />
      </div>
      <div
        className="resize_handle"
        ref={resize_handle_ref}
        onMouseDown={handle_mouse_down}
        onMouseMove={handle_mouse_move}
        onMouseUp={handle_mouse_up}
      ></div>
    </div>
  );
}
