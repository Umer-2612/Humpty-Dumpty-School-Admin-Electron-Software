'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "@/lib/api";
import {
  selectYears,
  selectSelectedYear,
  selectYearLoading,
  selectYearError,
  selectHasChosenYear,
  setYears,
  upsertYear,
  removeYear,
  setSelectedYear,
  setYearLoading,
  setYearError,
  setHasChosenYear as setHasChosenYearState,
} from "@/store";

const YearContext = createContext(null);

export const YearProvider = ({ children }) => {
  const dispatch = useDispatch();
  const years = useSelector(selectYears);
  const selected = useSelector(selectSelectedYear);
  const loading = useSelector(selectYearLoading);
  const error = useSelector(selectYearError);
  const hasChosenYear = useSelector(selectHasChosenYear);

  const loadYears = useCallback(async () => {
    dispatch(setYearLoading(true));
    try {
      const list = await api.listAcademicYears();
      const resolved = Array.isArray(list) ? list : [];
      dispatch(setYears(resolved));
      dispatch(setYearError(""));
      return resolved;
    } catch (error) {
      console.error(error);
      dispatch(setYearError("Failed to load academic years"));
      return [];
    } finally {
      dispatch(setYearLoading(false));
    }
  }, [dispatch]);

  const loadActive = useCallback(async () => {
    try {
      const active = await api.getActiveAcademicYear();
      return active;
    } catch (error) {
      console.error(error);
      return null;
    }
  }, []);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  useEffect(() => {
    if (!years.length) {
      if (selected !== null) {
        dispatch(setSelectedYear(null));
      }
      dispatch(setHasChosenYearState(false));
      return;
    }

    const active = years.find((y) => y.isActive);
    if (active) {
      if (!selected || String(selected.id) !== String(active.id)) {
        dispatch(setSelectedYear(active));
      }
      return;
    }

    if (!selected) {
      dispatch(setSelectedYear(years[0]));
    }
  }, [dispatch, years, selected]);

  useEffect(() => {
    const ready = !!(selected && selected.id);
    dispatch(setHasChosenYearState(ready));
  }, [dispatch, selected]);

  const value = useMemo(
    () => ({
      years,
      selected,
      setSelected: (year) => dispatch(setSelectedYear(year)),
      hasChosenYear,
      loadYears,
      refreshActive: loadActive,
      loading,
      error,
      addYear: async (payload) => {
        const result = await api.addAcademicYear(payload);
        if (result?.success === false) {
          throw new Error(result?.error || "Failed to add academic year");
        }
        const year = result.academicYear || result;
        if (year) {
          dispatch(upsertYear(year));
          dispatch(setSelectedYear(year));
          dispatch(setHasChosenYearState(false));
        }
        return year;
      },
      updateYear: async (payload) => {
        const result = await api.updateAcademicYear(payload);
        if (result?.success === false) {
          throw new Error(result?.error || "Failed to update academic year");
        }
        const year = result.academicYear || result;
        if (year) {
          dispatch(upsertYear(year));
          if (selected && String(selected.id) === String(year.id)) {
            dispatch(setSelectedYear(year));
            if (year.isActive) {
              dispatch(setHasChosenYearState(true));
            }
          }
        }
        return year;
      },
      deleteYear: async (id) => {
        const result = await api.deleteAcademicYear(id);
        if (result?.success === false) {
          throw new Error(result?.error || "Failed to delete academic year");
        }
        dispatch(removeYear(id));
        return true;
      },
      refreshYears: loadYears,
      setActiveYear: async (id) => {
        const response = await api.setActiveAcademicYear(id);
        if (response?.success === false) {
          throw new Error(response?.error || "Failed to set active academic year");
        }
        const activeYear = response?.academicYear || response || null;
        if (activeYear) {
          const updatedList = (years || []).map((year) =>
            String(year.id) === String(activeYear.id)
              ? { ...year, ...activeYear, isActive: true }
              : { ...year, isActive: false }
          );
          dispatch(setYears(updatedList));
          dispatch(setSelectedYear(activeYear));
          dispatch(setHasChosenYearState(true));
          dispatch(setYearError(""));
          return activeYear;
        }
        await loadYears();
        return null;
      },
      setHasChosenYear: (flag) => dispatch(setHasChosenYearState(flag)),
    }),
    [
      years,
      selected,
      hasChosenYear,
      loading,
      error,
      dispatch,
      loadYears,
      loadActive,
    ]
  );

  return <YearContext.Provider value={value}>{children}</YearContext.Provider>;
};

export const useYear = () => {
  const ctx = useContext(YearContext);
  if (!ctx) throw new Error("useYear must be used within YearProvider");
  return ctx;
};
