import { createSlice } from "@reduxjs/toolkit";

const RootFileListSlice = createSlice({
  name: "root_file_list",
  initialState: {
    root_file_list: {
      path: "",
      file_list: [],
    },
  },
  reducers: {
    set_path: (state, action) => {
      state.root_file_list.path = action.payload;
    },
    set_file_list: (state, action) => {
      state.root_file_list.file_list = action.payload;
    },
  },
});

export const { set_path, set_file_list } = RootFileListSlice.actions;

export default RootFileListSlice.reducer;
