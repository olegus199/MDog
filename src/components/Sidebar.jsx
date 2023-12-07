import "./Sidebar.scss";
import FileList from "./FileManager/FileList";
import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api";
import { useDispatch, useSelector } from "react-redux";
import { resizing } from "../state/ResizingSlice";
import { set_open } from "../state/SidebarOpenSlice";
import { set_path, set_file_list } from "../state/RootFileListSlice";

export default function Sidebar({ pass_zero_width }) {
  const resize_handle_ref = useRef(null);
  const [sidebar_width, set_sidebar_width] = useState(0);
  const [active_pop_up, set_active_pop_up] = useState(null);

  const dispatch = useDispatch();
  const is_resizing = useSelector((state) => state.resize.is_resizing);
  const sidebar_open = useSelector((state) => state.sidebar_open.is_open);
  const root_file_list = useSelector(
    (state) => state.root_file_list.root_file_list
  );

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
    if (sidebar_width === 0) {
      pass_zero_width(0);
    }
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

  // Getting root path and files
  useEffect(() => {
    const fetch_data = async () => {
      const path = await invoke("get_current_path");
      dispatch(set_path(path));
    };

    fetch_data();
  }, []);

  useEffect(() => {
    const fetch_directory = async () => {
      const response = await invoke("list_directory", {
        directory: root_file_list.path,
      });
      const filtered_response = filter_response(response);
      const added_paths = add_paths_for_folders(filtered_response);
      dispatch(set_file_list(added_paths));
    };

    if (root_file_list.path !== "") {
      fetch_directory();
    }
  }, [root_file_list.path]);

  const filter_response = (response) => {
    return response
      .filter((entry) => {
        return entry.name[0] !== ".";
      })
      .sort((e1, e2) => {
        return e1.name.toLowerCase() > e2.name.toLowerCase();
      });
  };

  const add_paths_for_folders = (file_list) => {
    for (let item of file_list) {
      if (item.entry_type === "folder") {
        item.local_path = root_file_list.path + "/" + item.name;
        item.local_file_list = [];
      }
    }

    return file_list;
  };

  useEffect(() => {
    console.log("Reducer's state:", root_file_list);
  }, [root_file_list]);

  return (
    <div
      className="sidebar"
      style={{ width: sidebar_width }}
      onMouseDown={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="upper_border"
        data-tauri-drag-region
      ></div>
      <div className="file_manager">
        {sidebar_open && (
          <FileList
            active_pop_up={active_pop_up}
            set_active_pop_up={set_active_pop_up}
          />
        )}
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
