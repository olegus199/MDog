import { configureStore } from "@reduxjs/toolkit";
import { default as content_reducer } from "./MDContentSlice";
import { default as resize } from "./ResizingSlice";
import { default as folder_active } from "./FolderActiveSlice";

export const store = configureStore({
  reducer: {
    content: content_reducer,
    resize: resize,
    active: folder_active,
  },
});
