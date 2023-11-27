import { createSlice } from "@reduxjs/toolkit";

const ResizingSlice = createSlice({
  name: "resizing_sidebar",
  initialState: {
    is_resizing: false,
  },
  reducers: {
    resizing: (state, action) => {
      state.is_resizing = action.payload;
    },
  },
});

export const { resizing } = ResizingSlice.actions;

export default ResizingSlice.reducer;
