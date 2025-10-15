import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  branches: [],
  selected: null,
  loading: false,
  error: "",
};

const branchSlice = createSlice({
  name: "branch",
  initialState,
  reducers: {
    setBranches(state, action) {
      state.branches = Array.isArray(action.payload) ? action.payload : [];
    },
    upsertBranch(state, action) {
      const branch = action.payload;
      if (!branch || !branch.id) return;
      const index = state.branches.findIndex((b) => String(b.id) === String(branch.id));
      if (index >= 0) {
        state.branches[index] = { ...state.branches[index], ...branch };
      } else {
        state.branches.push(branch);
      }
    },
    removeBranch(state, action) {
      const id = action.payload;
      state.branches = state.branches.filter((b) => String(b.id) !== String(id));
      if (state.selected && String(state.selected.id) === String(id)) {
        state.selected = state.branches[0] || null;
      }
    },
    setSelectedBranch(state, action) {
      state.selected = action.payload || null;
    },
    setBranchLoading(state, action) {
      state.loading = !!action.payload;
    },
    setBranchError(state, action) {
      state.error = action.payload || "";
    },
  },
});

export const {
  setBranches,
  upsertBranch,
  removeBranch,
  setSelectedBranch,
  setBranchLoading,
  setBranchError,
} = branchSlice.actions;

export const selectBranches = (state) => state.branch.branches;
export const selectSelectedBranch = (state) => state.branch.selected;
export const selectBranchLoading = (state) => state.branch.loading;
export const selectBranchError = (state) => state.branch.error;

export default branchSlice.reducer;
