import { createSlice } from "@reduxjs/toolkit";

const SidebarOpenSlice = createSlice({
  name: "sidebar_open",
  initialState: {
    is_open: false,
  },
  reducers: {
    set_open: (state, action) => {
      state.is_open = action.payload;
    },
  },
});

export const { set_open } = SidebarOpenSlice.actions;

export default SidebarOpenSlice.reducer;
