import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useYear } from "../context/YearProvider.jsx";

function parseStartYear(name) {
  // name format like "2025-26"
  const n = String(name || "");
  const part = n.split("-")[0];
  const y = parseInt(part, 10);
  return Number.isFinite(y) ? y : null;
}

function makeYearPayloadFromStart(startYear) {
  const s = Number(startYear);
  if (!Number.isFinite(s)) return null;
  const endYear = s + 1;
  const name = `${s}-${String(endYear).slice(-2)}`;
  const start_date = `${s}-04-01`;
  const end_date = `${endYear}-03-31`;
  return { name, start_date, end_date };
}

export default function YearManagerDialog({ open, onClose }) {
  const { years, selected, addYear, setActiveYear, refreshYears } = useYear();
  const [selectedCreateStart, setSelectedCreateStart] = useState("");
  const [activateTarget, setActivateTarget] = useState(selected?.id || "");
  const activeYear = selected;

  const baseStart = useMemo(() => {
    // Prefer selected year, else the latest (max start_date)
    if (activeYear?.name) {
      const s = parseStartYear(activeYear.name);
      if (s) return s;
    }
    if (Array.isArray(years) && years.length) {
      const sorted = [...years].sort((a, b) => String(b.start_date).localeCompare(String(a.start_date)));
      const s = parseStartYear(sorted[0]?.name);
      if (s) return s;
    }
    const now = new Date();
    return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  }, [activeYear, years]);

  const yearOptions = useMemo(() => {
    // Build list around baseStart then exclude already created years
    const existing = new Set((years || []).map((y) => y.name));
    const out = [];
    for (let i = 5; i >= 1; i--) {
      const s = baseStart - i;
      const p = makeYearPayloadFromStart(s);
      if (p && !existing.has(p.name)) out.push(p);
    }
    for (let i = 1; i <= 5; i++) {
      const s = baseStart + i;
      const p = makeYearPayloadFromStart(s);
      if (p && !existing.has(p.name)) out.push(p);
    }
    return out;
  }, [baseStart, years]);

  // Auto-select first option if none selected
  useEffect(() => {
    if (!selectedCreateStart && yearOptions.length) {
      setSelectedCreateStart(parseInt(yearOptions[0].name.split("-")[0], 10));
    }
  }, [yearOptions, selectedCreateStart]);

  const handleCreateFromDropdown = async (startYear) => {
    try {
      const target = startYear ?? selectedCreateStart;
      if (!target) return;
      const payload = makeYearPayloadFromStart(parseInt(String(target), 10));
      if (!payload) return;
      await addYear(payload);
      await refreshYears();
      setSelectedCreateStart("");
    } catch (e) {
      console.error("Failed to create year:", e);
    }
  };

  const handleActivate = async () => {
    try {
      if (!activateTarget) return;
      await setActiveYear(activateTarget);
      await refreshYears();
    } catch (e) {
      console.error("Failed to activate year:", e);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Manage Academic Years</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Active: {activeYear?.name || "—"}
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="create-year">Create Year</InputLabel>
            <Select
              labelId="create-year"
              label="Create Year"
              value={selectedCreateStart}
              onChange={async (e) => {
                const val = e.target.value;
                setSelectedCreateStart(val);
                await handleCreateFromDropdown(val);
              }}
            >
              {yearOptions.map((opt) => (
                <MenuItem key={opt.start_date} value={parseInt(opt.name.split("-")[0], 10)}>
                  {opt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <FormControl fullWidth>
            <InputLabel id="activate-year">Activate Year</InputLabel>
            <Select
              labelId="activate-year"
              label="Activate Year"
              value={activateTarget}
              onChange={(e) => setActivateTarget(e.target.value)}
            >
              {years.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Button variant="contained" onClick={handleActivate}>Activate</Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
