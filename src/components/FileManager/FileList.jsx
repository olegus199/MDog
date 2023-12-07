import "./FileList.scss";
import { useEffect, useState } from "react";
import FileItem from "./FileItem";
import { invoke } from "@tauri-apps/api";
import { useDispatch, useSelector } from "react-redux";
import { set_content } from "../../state/MDContentSlice";
import { set_path, set_file_list } from "../../state/RootFileListSlice";
import { add_path, remove_path } from "../../state/OpenedPathsSlice";

export default function FileList({
  selected_list,
  active_pop_up,
  set_active_pop_up,
}) {
  // const [current_path, set_current_path] = useState("");
  const root_file_list = useSelector(
    (state) => state.root_file_list.root_file_list
  );
  const opened_paths = useSelector((state) => state.opened_paths.paths);
  const dispatch = useDispatch();

  const current_list = selected_list
    ? JSON.parse(JSON.stringify(selected_list))
    : JSON.parse(JSON.stringify(root_file_list));

  // console.log("Opened paths", opened_paths);

  const handle_click = (name, type, active) => {
    if (type === "folder") {
      const idx = current_list.file_list.findIndex((obj) => obj.name === name);
      // console.log("Current list in handle_click:", current_list);
      const fetch_directory = async () => {
        const response = await invoke("list_directory", {
          directory: current_list.file_list[idx].path,
        });
        const filtered_response = filter_response(response);
        console.log("Filtered respnose:", filtered_response);
        add_paths_for_folders(filtered_response);
        console.log("Filtered respnose with sosi pisky:", filtered_response);
        const new_list = JSON.parse(JSON.stringify(current_list));

        if (active) {
          new_list.file_list[idx].file_list = filtered_response;
          dispatch(set_file_list(new_list.file_list));
          dispatch(add_path(new_list.file_list[idx].path));
        } else {
          new_list.file_list[idx].file_list = [];
          dispatch(set_file_list(new_list.file_list));
          dispatch(remove_path(new_list.file_list[idx].path));
        }

        // console.log("New list:", new_list);
      };

      fetch_directory();
    }
  };

  // console.log(opened_paths);

  const regex = /^[\w$@#%&*^`~'"|_-]+\.md$/;

  const handle_double_click = async (name, type) => {
    if (type === "file" && regex.test(name)) {
      const get_md_content = async () => {
        const response = await invoke("get_md_content", {
          filePath: `${current_path}/${name}`,
        });
        dispatch(set_content(response));
      };
      get_md_content();
    }
  };

  // const handle_escape = async () => {
  //   let new_path = current_path;
  //   const last_slash_index = current_path.lastIndexOf("/");
  //   if (last_slash_index > 0) {
  //     new_path = current_path.substring(0, last_slash_index);
  //   }
  //   await invoke("change_directory", { to: `${new_path}` });
  //   set_current_path(new_path);

  //   const response = await invoke("list_current_directory");
  //   const filtered_response = filter_response(response);
  //   set_current_files(filtered_response);
  // };

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
    file_list = "sosi pisky";
    return;
    for (let item of file_list) {
      if (item.entry_type === "folder") {
        // console.log("Current list:", current_list);
        item.path = current_list.path + "/" + item.name;
        item.file_list = [];
      }
    }
  };

  console.log("Current list:", current_list);

  return (
    <>
      {/* <div
        onClick={handle_escape}
        className="escape"
      >
        escape
      </div> */}
      {current_list.file_list.map((file, index) => (
        <div key={index}>
          <FileItem
            name={file.name}
            type={file.entry_type}
            regex={regex}
            on_click={handle_click}
            on_double_click={handle_double_click}
            active_pop_up={active_pop_up}
            set_active_pop_up={set_active_pop_up}
          />
          <div className="nested_file_list">
            {opened_paths.includes(current_list.file_list[index].path) && (
              <FileList
                selected_list={current_list.file_list[index]}
                active_pop_up={active_pop_up}
                set_active_pop_up={set_active_pop_up}
              />
            )}
          </div>
        </div>
      ))}
    </>
  );
}
