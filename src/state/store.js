import { configureStore } from "@reduxjs/toolkit";
import { default as content_reducer } from "./MDContentSlice";
import { default as resize } from "./ResizingSlice";
import { default as sidebar_open } from "./SidebarOpenSlice";

export const store = configureStore({
  reducer: {
    content: content_reducer,
    resize: resize,
    sidebar_open: sidebar_open,
  },
});
