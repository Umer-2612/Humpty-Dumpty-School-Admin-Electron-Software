'use client';

import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "@/lib/api";
import {
  selectBranches,
  selectSelectedBranch,
  selectBranchLoading,
  selectBranchError,
  setBranches,
  upsertBranch,
  removeBranch,
  setSelectedBranch,
  setBranchLoading,
  setBranchError,
} from "@/store";

export const BranchContext = createContext(null);

const extractId = (input) => {
  if (input && typeof input === "object") return input.id ?? null;
  if (input === undefined || input === null) return null;
  return input;
};

export const BranchProvider = ({ children }) => {
  const dispatch = useDispatch();
  const branches = useSelector(selectBranches);
  const selected = useSelector(selectSelectedBranch);
  const loading = useSelector(selectBranchLoading);
  const error = useSelector(selectBranchError);

  const selectedRef = useRef(selected);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const setSelection = useCallback(
    (list, preferredId = null) => {
      if (!Array.isArray(list) || list.length === 0) {
        dispatch(setSelectedBranch(null));
        return null;
      }

      let candidate = null;

      if (preferredId != null) {
        candidate = list.find((b) => String(b.id) === String(preferredId));
      }

      if (!candidate && selectedRef.current) {
        candidate = list.find(
          (b) => String(b.id) === String(selectedRef.current?.id)
        );
      }

      if (!candidate) {
        candidate = list[0];
      }

      dispatch(setSelectedBranch(candidate));
      return candidate;
    },
    [dispatch]
  );

  const loadBranches = useCallback(
    async (options = {}) => {
      const { forceSelectId = null } = options;
      dispatch(setBranchLoading(true));
      try {
        const fetched = await api.getBranches();
        const list = Array.isArray(fetched) ? fetched : [];
        dispatch(setBranches(list));
        dispatch(setBranchError(""));
        setSelection(list, forceSelectId);
        return list;
      } catch (error) {
        console.error("[BranchProvider] Failed to load branches:", error);
        dispatch(setBranchError(error?.message || "Failed to load branches"));
        return [];
      } finally {
        dispatch(setBranchLoading(false));
      }
    },
    [dispatch, setSelection]
  );

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const selectBranch = useCallback(
    (branchOrId) => {
      const targetId = extractId(branchOrId);
      if (!branches.length) {
        dispatch(setSelectedBranch(null));
        return null;
      }

      if (targetId != null) {
        const match = branches.find((b) => String(b.id) === String(targetId));
        if (match) {
          dispatch(setSelectedBranch(match));
          selectedRef.current = match;
          return match;
        }
      }

      if (branchOrId && typeof branchOrId === "object") {
        const match = branches.find((b) => String(b.id) === String(branchOrId.id));
        const resolved = match || branchOrId;
        dispatch(setSelectedBranch(resolved));
        selectedRef.current = resolved;
        return resolved;
      }

      if (selectedRef.current) {
        const match = branches.find(
          (b) => String(b.id) === String(selectedRef.current.id)
        );
        if (match) {
          dispatch(setSelectedBranch(match));
          selectedRef.current = match;
          return match;
        }
      }

      return setSelection(branches);
    },
    [dispatch, branches, setSelection]
  );

  const addBranch = useCallback(
    async (payload) => {
      const result = await api.addBranch(payload || {});
      if (!result || result.success === false) {
        throw new Error(result?.error || "Failed to add branch");
      }
      const branch = result.branch || result;
      if (branch) {
        dispatch(upsertBranch(branch));
        dispatch(setSelectedBranch(branch));
        selectedRef.current = branch;
        dispatch(setBranchError(""));
        return branch;
      }
      const branchId = result?.branch?.id ?? null;
      await loadBranches({ forceSelectId: branchId });
      return branch || null;
    },
    [dispatch, loadBranches]
  );

  const updateBranch = useCallback(
    async (payload) => {
      const result = await api.updateBranch(payload || {});
      if (!result || result.success === false) {
        throw new Error(result?.error || "Failed to update branch");
      }
      const branch = result.branch || result;
      if (branch) {
        dispatch(upsertBranch(branch));
        if (branch.id != null) {
          dispatch(setSelectedBranch(branch));
          selectedRef.current = branch;
        }
        dispatch(setBranchError(""));
        return branch;
      }
      const branchId = result?.branch?.id ?? extractId(payload?.id);
      await loadBranches({ forceSelectId: branchId });
      return branch || null;
    },
    [dispatch, loadBranches]
  );

  const deleteBranch = useCallback(
    async (id) => {
      const result = await api.deleteBranch(id);
      if (!result || result.success === false) {
        throw new Error(result?.error || "Failed to delete branch");
      }
      dispatch(removeBranch(id));
      const remaining = branches.filter((b) => String(b.id) !== String(id));
      setSelection(remaining);
      dispatch(setBranchError(""));
      return true;
    },
    [dispatch, branches, setSelection]
  );

  const value = useMemo(
    () => ({
      branches,
      selected,
      loading,
      error,
      setSelected: selectBranch,
      selectBranch,
      loadBranches,
      addBranch,
      updateBranch,
      deleteBranch,
    }),
    [branches, selected, loading, error, selectBranch, loadBranches, addBranch, updateBranch, deleteBranch]
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
};
