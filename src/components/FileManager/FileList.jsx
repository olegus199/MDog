import { useEffect, useState } from "react";
import FileItem from "./FileItem";
import { invoke } from "@tauri-apps/api";
import "./FileList.scss";
import { useDispatch } from "react-redux";
import { set_content } from "../../state/MDContentSlice";

export default function FileList({ new_directory }) {
  const [current_path, set_current_path] = useState("");
  const [current_files, set_current_files] = useState([]);
  const [selected_path, set_selected_path] = useState("");
  const [expanded_items, set_expanded_items] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    if (new_directory) {
      set_current_path(new_directory);
    } else {
      const fetch_data = async () => {
        const path = await invoke("get_current_path");
        set_current_path(path);
      };

      fetch_data();
    }
  }, []);

  useEffect(() => {
    const fetch_directory = async () => {
      const response = await invoke("list_directory", {
        directory: current_path,
      });
      const filtered_response = filter_response(response);
      set_current_files(filtered_response);
    };

    if (current_path !== "") {
      fetch_directory();
    }
  }, [current_path]);

  const handle_click = (name, type, active) => {
    if (type === "folder") {
      const new_path = `${current_path}/${name}`;
      set_selected_path(new_path);
      if (active) {
        set_expanded_items((prev_expanded_items) => [
          ...prev_expanded_items,
          new_path,
        ]);
      } else {
        set_expanded_items(expanded_items.filter((item) => item !== new_path));
      }
    }
  };

  const regex = /^[\w$@#%&*^`~'"|_-]+\.md$/;

  const handle_double_click = async (name, type) => {
    // if (type === "folder") {
    //   const new_path = `${current_path}/${name}`;
    //   await invoke("change_directory", {
    //     to: new_path,
    //   });
    //   set_current_path(new_path);

    //   const response = await invoke("list_current_directory");
    //   const filtered_response = filter_response(response);
    //   set_current_files(filtered_response);
    // }
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

  const handle_escape = async () => {
    let new_path = current_path;
    const last_slash_index = current_path.lastIndexOf("/");
    if (last_slash_index > 0) {
      new_path = current_path.substring(0, last_slash_index);
    }
    await invoke("change_directory", { to: `${new_path}` });
    set_current_path(new_path);

    const response = await invoke("list_current_directory");
    const filtered_response = filter_response(response);
    set_current_files(filtered_response);
  };

  const filter_response = (response) => {
    return response
      .filter((entry) => {
        return entry.name[0] !== ".";
      })
      .sort((e1, e2) => {
        return e1.name.toLowerCase() > e2.name.toLowerCase();
      });
  };

  return (
    <>
      {/* <div
        onClick={handle_escape}
        className="escape"
      >
        escape
      </div> */}
      {current_files.map((file, index) => (
        <div key={index}>
          <FileItem
            name={file.name}
            type={file.entry_type}
            regex={regex}
            on_click={handle_click}
            on_double_click={handle_double_click}
          />
          <div className="nested_file_list">
            {expanded_items.includes(`${current_path}/${file.name}`) && (
              <FileList new_directory={selected_path} />
            )}
          </div>
        </div>
      ))}
    </>
  );
}
