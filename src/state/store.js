import { configureStore } from "@reduxjs/toolkit";
import { default as content_reducer } from "./MDContentSlice";
import { default as resize } from "./ResizingSlice";
import { default as sidebar_open } from "./SidebarOpenSlice";
import { default as root_file_list } from "./RootFileListSlice";
import { default as opened_paths } from "./OpenedPathsSlice";

export const store = configureStore({
  reducer: {
    content: content_reducer,
    resize: resize,
    sidebar_open: sidebar_open,
    root_file_list: root_file_list,
    opened_paths: opened_paths,
  },
});
