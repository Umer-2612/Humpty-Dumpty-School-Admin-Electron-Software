import React, { createContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const BranchContext = createContext();

export const BranchProvider = ({ children }) => {
  const [branches, setBranches] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      console.log("[BranchProvider] Attempting to fetch branches...");
      if (window.electronAPI && typeof window.electronAPI.getBranches === 'function') {
        try {
          const data = await window.electronAPI.getBranches();
          console.log("[BranchProvider] Successfully received branches:", data);
          setBranches(data);
          if (data && data.length > 0) {
            setSelected(data[0]);
          }
        } catch (err) {
          console.error("[BranchProvider] Error calling getBranches:", err);
        }
      } else {
        console.error(
          '[BranchProvider] window.electronAPI.getBranches is not available. This is expected in a web browser, but not in Electron. Please ensure you are running the app via `npm run dev` from the root directory.'
        );
      }
    };

    fetchBranches();
  }, []);

  return (
    <BranchContext.Provider value={{ branches, selected, setSelected }}>
      {children}
    </BranchContext.Provider>
  );
};
