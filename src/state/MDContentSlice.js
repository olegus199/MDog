import { createSlice } from "@reduxjs/toolkit";

const MDContentSlice = createSlice({
  name: "content",
  initialState: {
    md_content: "",
    is_loaded: false,
  },
  reducers: {
    set_content: (state, action) => {
      state.md_content = action.payload;
      state.is_loaded = action.payload !== "";
    },
  },
});

export const { set_content } = MDContentSlice.actions;

export default MDContentSlice.reducer;
