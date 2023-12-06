import { useEffect, useRef, useState } from "react";
import "./Sidebar.scss";
import FileList from "./FileManager/FileList";
import { useDispatch, useSelector } from "react-redux";
import { resizing } from "../state/ResizingSlice";
import { set_open } from "../state/SidebarOpenSlice";

export default function Sidebar({ pass_zero_width }) {
  const sidebar_ref = useRef(null);
  const filemanager_ref = useRef(null);
  const resize_handle_ref = useRef(null);
  const [sidebar_width, set_sidebar_width] = useState(0);
  const [active_pop_up, set_active_pop_up] = useState(null);

  const dispatch = useDispatch();
  const is_resizing = useSelector((state) => state.resize.is_resizing);
  const sidebar_open = useSelector((state) => state.sidebar_open.is_open);

  // Props for toggled sidebar
  useEffect(() => {
    if (sidebar_open) {
      set_sidebar_width(180);
    } else {
      set_sidebar_width(0);
    }
  }, [sidebar_open]);

  // Resizing logic
  const handle_mouse_down = (event) => {
    event.preventDefault();
    dispatch(resizing(true));
  };

  const handle_mouse_move = (event) => {
    if (is_resizing) {
      const new_width = Math.min(Math.max(event.clientX, 75), 400);
      set_sidebar_width(new_width);

      if (event.clientX < 20) {
        set_sidebar_width(0);
      }
    }
  };

  const handle_mouse_up = () => {
    dispatch(resizing(false));
  };

  useEffect(() => {
    if (!is_resizing && sidebar_width === 0) {
      dispatch(set_open(false));
    }
  }, [is_resizing, sidebar_width]);

  useEffect(() => {
    pass_zero_width(sidebar_width);
  }, [sidebar_width]);

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

  return (
    <div
      className="sidebar"
      style={{ width: sidebar_width }}
      ref={sidebar_ref}
      onMouseDown={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="upper_border"
        data-tauri-drag-region
      ></div>
      <div
        className="file_manager"
        ref={filemanager_ref}
      >
        <FileList
          active_pop_up={active_pop_up}
          set_active_pop_up={set_active_pop_up}
        />
      </div>
      <div
        className="resize_handle"
        ref={resize_handle_ref}
        onMouseDown={handle_mouse_down}
        onMouseMove={handle_mouse_move}
        onMouseUp={handle_mouse_up}
      />
    </div>
  );
}
