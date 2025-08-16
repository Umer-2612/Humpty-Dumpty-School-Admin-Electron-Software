import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const YearContext = createContext(null);

export const YearProvider = ({ children }) => {
  const [years, setYears] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasChosenYear, setHasChosenYear] = useState(false);

  const loadYears = async () => {
    try {
      const list = await window.electronAPI.listAcademicYears();
      setYears(list || []);
      return list || [];
    } catch (e) {
      setError("Failed to load academic years", e);
      return [];
    }
  };

  const loadActive = async () => {
    try {
      const active = await window.electronAPI.getActiveAcademicYear();
      // Intentionally do NOT auto-select on startup. We only return it for callers
      // that explicitly want to know, but selection remains user-driven.
      return active;
    } catch (e) {
      console.log(e);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log("first", mounted);
    (async () => {
      setLoading(true);
      await loadYears();
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      years,
      selected,
      setSelected,
      hasChosenYear,
      refreshYears: loadYears,
      refreshActive: loadActive,
      loading,
      error,
      addYear: (payload) => window.electronAPI.addAcademicYear(payload),
      updateYear: (payload) => window.electronAPI.updateAcademicYear(payload),
      setActiveYear: async (id) => {
        await window.electronAPI.setActiveAcademicYear(id);
        const active = await window.electronAPI.getActiveAcademicYear();
        setSelected(active);
        setHasChosenYear(true);
        return active;
      },
    }),
    [years, selected, hasChosenYear, loading, error]
  );

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useYear = () => {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear must be used within YearProvider");
  return ctx;
};
