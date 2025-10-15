import { configureStore } from "@reduxjs/toolkit";
import branchReducer from "./branchSlice.js";
import yearReducer from "./yearSlice.js";

const store = configureStore({
  reducer: {
    branch: branchReducer,
    year: yearReducer,
  },
});

export default store;
