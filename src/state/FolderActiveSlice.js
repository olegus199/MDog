import { createSlice } from "@reduxjs/toolkit";

const FolderActiveSlice = createSlice({
  name: "folder_active",
  initialState: {
    is_active: false,
  },
  reducers: {
    set_active: (state, action) => {
      state.is_active = action.payload;
    },
  },
});

export const { set_active } = FolderActiveSlice.actions;

export default FolderActiveSlice.reducer;
