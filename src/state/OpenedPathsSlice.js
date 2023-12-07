import { createSlice } from "@reduxjs/toolkit";

const OpenedPathsSlice = createSlice({
  name: "opened_paths",
  initialState: {
    paths: [],
  },
  reducers: {
    add_path: (state, action) => {
      state.paths.push(action.payload);
    },
    remove_path: (state, action) => {
      state.paths = state.paths.filter((path) => path !== action.payload);
    },
  },
});

export const { add_path, remove_path } = OpenedPathsSlice.actions;

export default OpenedPathsSlice.reducer;
