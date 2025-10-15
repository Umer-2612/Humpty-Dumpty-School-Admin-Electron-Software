import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  years: [],
  selected: null,
  loading: false,
  error: "",
  hasChosenYear: false,
};

const yearSlice = createSlice({
  name: "year",
  initialState,
  reducers: {
    setYears(state, action) {
      state.years = Array.isArray(action.payload) ? action.payload : [];
    },
    upsertYear(state, action) {
      const year = action.payload;
      if (!year || !year.id) return;
      const index = state.years.findIndex((y) => String(y.id) === String(year.id));
      if (index >= 0) {
        state.years[index] = { ...state.years[index], ...year };
      } else {
        state.years.push(year);
      }
    },
    removeYear(state, action) {
      const id = action.payload;
      state.years = state.years.filter((y) => String(y.id) !== String(id));
      if (state.selected && String(state.selected.id) === String(id)) {
        state.selected = null;
        state.hasChosenYear = false;
      }
    },
    setSelectedYear(state, action) {
      state.selected = action.payload || null;
    },
    setYearLoading(state, action) {
      state.loading = !!action.payload;
    },
    setYearError(state, action) {
      state.error = action.payload || "";
    },
    setHasChosenYear(state, action) {
      state.hasChosenYear = !!action.payload;
    },
  },
});

export const {
  setYears,
  upsertYear,
  removeYear,
  setSelectedYear,
  setYearLoading,
  setYearError,
  setHasChosenYear,
} = yearSlice.actions;

export const selectYears = (state) => state.year.years;
export const selectSelectedYear = (state) => state.year.selected;
export const selectYearLoading = (state) => state.year.loading;
export const selectYearError = (state) => state.year.error;
export const selectHasChosenYear = (state) => state.year.hasChosenYear;

export default yearSlice.reducer;
