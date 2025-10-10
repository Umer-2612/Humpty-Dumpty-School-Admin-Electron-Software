import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const BranchContext = createContext(null);

const extractId = (input) => {
  if (input && typeof input === "object") return input.id ?? null;
  if (input === undefined || input === null) return null;
  return input;
};

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadBranches = useCallback(
    async (options = {}) => {
      const { forceSelectId = null } = options;
      if (!window?.electronAPI?.getBranches) {
        console.error(
          "[BranchProvider] getBranches API unavailable. Ensure Electron is running."
        );
        return [];
      }

      setLoading(true);
      try {
        const fetched = await window.electronAPI.getBranches();
        const list = Array.isArray(fetched) ? fetched : [];
        setBranches(list);

        setSelected((prev) => {
          if (!list.length) return null;

          if (forceSelectId != null) {
            const forced = list.find(
              (b) => String(b.id) === String(forceSelectId)
            );
            if (forced) return forced;
          }

          if (prev) {
            const match = list.find((b) => String(b.id) === String(prev.id));
            if (match) return match;
          }

          return list[0];
        });

        return list;
      } catch (error) {
        console.error("[BranchProvider] Failed to load branches:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const selectBranch = useCallback(
    (branchOrId) => {
      const targetId = extractId(branchOrId);
      setSelected((prev) => {
        if (!branches.length) return null;

        if (targetId != null) {
          const match = branches.find(
            (b) => String(b.id) === String(targetId)
          );
          if (match) return match;
        }

        if (branchOrId && typeof branchOrId === "object") {
          const match = branches.find(
            (b) => String(b.id) === String(branchOrId.id)
          );
          if (match) return match;
          return branchOrId;
        }

        if (prev) {
          const match = branches.find(
            (b) => String(b.id) === String(prev.id)
          );
          if (match) return match;
        }

        return branches[0] || null;
      });
    },
    [branches]
  );

  const addBranch = useCallback(
    async (payload) => {
      if (!window?.electronAPI?.addBranch) {
        throw new Error("Branch creation API unavailable");
      }
      const result = await window.electronAPI.addBranch(payload || {});
      if (!result || result.success === false) {
        throw new Error(result?.error || "Failed to add branch");
      }
      const branchId = result?.branch?.id ?? null;
      await loadBranches({ forceSelectId: branchId });
      return result.branch;
    },
    [loadBranches]
  );

  const updateBranch = useCallback(
    async (payload) => {
      if (!window?.electronAPI?.updateBranch) {
        throw new Error("Branch update API unavailable");
      }
      const result = await window.electronAPI.updateBranch(payload || {});
      if (!result || result.success === false) {
        throw new Error(result?.error || "Failed to update branch");
      }
      const branchId = result?.branch?.id ?? extractId(payload?.id);
      await loadBranches({ forceSelectId: branchId });
      return result.branch;
    },
    [loadBranches]
  );

  const deleteBranch = useCallback(
    async (id) => {
      if (!window?.electronAPI?.deleteBranch) {
        throw new Error("Branch delete API unavailable");
      }
      const result = await window.electronAPI.deleteBranch(id);
      if (!result || result.success === false) {
        throw new Error(result?.error || "Failed to delete branch");
      }
      await loadBranches();
      return true;
    },
    [loadBranches]
  );

  const value = useMemo(
    () => ({
      branches,
      selected,
      loading,
      setSelected: selectBranch,
      selectBranch,
      loadBranches,
      addBranch,
      updateBranch,
      deleteBranch,
    }),
    [
      branches,
      selected,
      loading,
      selectBranch,
      loadBranches,
      addBranch,
      updateBranch,
      deleteBranch,
    ]
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
};
