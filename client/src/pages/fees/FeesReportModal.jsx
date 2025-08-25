import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Modal from "../../component/Modal";
import { useBranch } from "../../context/useBranch";
import { useYear } from "../../context/YearProvider";

const monthOrder = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toMonthName(val) {
  if (!val) return null;
  const s = String(val).trim();
  let m = s.match(/^(\d{4})[-.](\d{1,2})$/);
  if (m) {
    const idx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
    return new Date(2000, idx, 1).toLocaleString(undefined, { month: "long" });
  }
  m = s.match(/^(\d{1,2})[-.](\d{4})$/);
  if (m) {
    const idx = Math.max(0, Math.min(11, parseInt(m[1], 10) - 1));
    return new Date(2000, idx, 1).toLocaleString(undefined, { month: "long" });
  }
  const monthNames = monthOrder.map((x) => x.toLowerCase());
  const lower = s.toLowerCase();
  const found = monthNames.find((mn) => lower.includes(mn));
  if (found) return found.charAt(0).toUpperCase() + found.slice(1);
  return null;
}

function aggregateFees(rows, { className, division, studentId }) {
  // Build structure: { [month]: { cash: total, bank: total, classes: { [className]: { [division]: { cash, bank } } } } }
  const agg = {};
  for (const r of rows || []) {
    const month = toMonthName(r.month_year) || "Unknown";
    const payType =
      String(r.payment_type || "").toLowerCase() === "cash" ? "cash" : "bank";
    const amt = Number(r.amount) || 0;
    const cls = r.class_name || "";
    const div = r.division || "";
    const sid = r.student_id ?? r.studentId ?? r.studentID ?? null;

    // Filter
    if (className && cls !== className) continue;
    if (
      division &&
      String(div || "")
        .toUpperCase()
        .trim() !== String(division).toUpperCase().trim()
    )
      continue;
    if (studentId && String(sid || "") !== String(studentId)) continue;

    if (!agg[month]) {
      agg[month] = { cash: 0, bank: 0 };
    }
    agg[month][payType] += amt;
  }
  return agg;
}

export default function FeesReportModal({ open, onClose }) {
  const { selected: branch } = useBranch?.() || {};
  const { selected: year } = useYear();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [classOptions, setClassOptions] = useState([]); // legacy, not used once classEntries wired
  const [selectedClass, setSelectedClass] = useState(""); // derived from selected entry
  const [divisionOptions, setDivisionOptions] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [classEntries, setClassEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState("");
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]); // multiple selection
  // No extra exporting controls to match other report UIs

  console.log(classOptions);

  useEffect(() => {
    const load = async () => {
      if (!open) return;
      if (!branch?.id) return;
      setLoading(true);
      setError("");
      try {
        const rows = await window.electronAPI.getFees(
          branch.id,
          year?.id || null
        );
        const list = Array.isArray(rows)
          ? rows
          : Array.isArray(rows?.fees)
          ? rows.fees
          : [];
        setFees(list);
        // Clear division options; they will be driven by class entry selection like AddStudentModal
        setDivisionOptions([]);
        // Build student options (All + unique by id with name)
        const seen = new Set();
        const students = [];
        (list || []).forEach((r) => {
          const id = r.student_id ?? r.studentId ?? r.studentID;
          const name = r.student_name || r.name || "";
          if (id != null && !seen.has(String(id))) {
            seen.add(String(id));
            students.push({ id: String(id), name: name || String(id) });
          }
        });
        students.sort((a, b) => a.name.localeCompare(b.name));
        setStudentOptions([{ id: "", name: "All" }, ...students]);
        // Month options: show all months for selection
        setMonthOptions([...monthOrder]);
      } catch (e) {
        console.error(e);
        setError("Failed to load fees for report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, branch?.id, year?.id]);

  // Fetch all classes for class dropdown (show all classes, not just in fees data)
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!branch?.id) {
          setClassOptions([""]);
          return;
        }
        const data = await window.electronAPI.getClassesByBranch(branch.id);
        const names = (data || [])
          .map((c) => c?.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setClassOptions(["", ...names]);
      } catch (e) {
        console.error("Failed to fetch classes for fees report", e);
      }
    };
    fetchClasses();
  }, [branch?.id]);

  // Fetch class entries (class + shift + division_count) to mirror AddStudentModal behavior
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        if (!branch?.id) {
          setClassEntries([]);
          return;
        }
        const list = await window.electronAPI.listClassesByBranch(branch.id);
        setClassEntries(list || []);
      } catch (e) {
        console.error("Failed to fetch class entries for fees report", e);
      }
    };
    fetchEntries();
  }, [branch?.id]);

  // Update division options when class entry changes (dependent like AddStudentModal)
  useEffect(() => {
    const entry = (classEntries || []).find(
      (e) => String(e.id) === String(selectedEntryId || "")
    );
    const count = Number(entry?.division_count || 0);
    if (entry && count > 0) {
      const letters = Array.from({ length: count }, (_, i) =>
        String.fromCharCode(65 + i)
      );
      setDivisionOptions(letters);
      if (!letters.includes(String(selectedDivision || ""))) {
        setSelectedDivision("");
      }
      // Also set selectedClass for aggregation filter
      setSelectedClass(entry.class_name || "");
    } else {
      setDivisionOptions([]);
      setSelectedDivision("");
      setSelectedClass("");
    }
  }, [selectedEntryId, classEntries, selectedDivision]);

  const agg = useMemo(
    () =>
      aggregateFees(fees, {
        className: selectedClass || null,
        division: selectedDivision || null,
        studentId: selectedStudent || null,
      }),
    [fees, selectedClass, selectedDivision, selectedStudent]
  );

  const monthsSorted = useMemo(() => {
    const keys = Object.keys(agg).sort(
      (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
    );
    if (selectedMonths && selectedMonths.length > 0) {
      const set = new Set(selectedMonths);
      return keys.filter((k) => set.has(k));
    }
    return keys;
  }, [agg, selectedMonths]);

  // Keep UI minimal and consistent; use browser print for hard copy

  return (
    <Modal open={open} onClose={onClose} title="Fees Report" maxWidth="md">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Filters - align with Students report style */}
        {/* Header chips like other reports */}
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mb: 1 }}>
          <Chip size="small" label={`Branch: ${branch?.name || "-"}`} />
          <Chip
            size="small"
            label={`Year: ${year?.name || year?.year_name || "-"}`}
          />
          <Chip size="small" label={`Class: ${selectedClass || "All"}`} />
          <Chip size="small" label={`Division: ${selectedDivision || "All"}`} />
          <Chip
            size="small"
            label={`Student: ${
              selectedStudent
                ? studentOptions.find((s) => s.id === String(selectedStudent))
                    ?.name || selectedStudent
                : "All"
            }`}
          />
          <Chip
            size="small"
            label={`Months: ${
              selectedMonths.length ? selectedMonths.join(", ") : "All"
            }`}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mb: 1 }}
        >
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="fees-report-class-entry-label" shrink>
              Class & Shift
            </InputLabel>
            <Select
              labelId="fees-report-class-entry-label"
              label="Class & Shift"
              value={selectedEntryId}
              onChange={(e) => setSelectedEntryId(e.target.value)}
              displayEmpty
              renderValue={(val) => {
                if (!val) return "All";
                const ce = (classEntries || []).find(
                  (x) => String(x.id) === String(val)
                );
                return (
                  (
                    (ce?.class_name || "") +
                    " - " +
                    (ce?.shift_name || "")
                  ).trim() || "All"
                );
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {(classEntries || []).map((ce) => (
                <MenuItem key={ce.id} value={ce.id}>
                  {(ce.class_name || "") + " - " + (ce.shift_name || "")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="fees-report-division-label" shrink>
              Division
            </InputLabel>
            <Select
              labelId="fees-report-division-label"
              label="Division"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              displayEmpty
              renderValue={(val) => (val ? val : "All")}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {divisionOptions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="fees-report-student-label" shrink>
              Student
            </InputLabel>
            <Select
              labelId="fees-report-student-label"
              label="Student"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              displayEmpty
              renderValue={(val) => {
                if (!val) return "All";
                return (
                  studentOptions.find((s) => s.id === String(val))?.name ||
                  "All"
                );
              }}
            >
              {studentOptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="fees-report-months-label" shrink>
              Month(s)
            </InputLabel>
            <Select
              labelId="fees-report-months-label"
              label="Month(s)"
              multiple
              value={selectedMonths}
              onChange={(e) => setSelectedMonths(e.target.value)}
              renderValue={(selected) =>
                (selected || []).length === 0
                  ? "All"
                  : (selected || []).join(", ")
              }
            >
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="text"
            color="inherit"
            onClick={() => {
              setSelectedClass("");
              setSelectedDivision("");
              setSelectedStudent("");
              setSelectedMonths([]);
              setSelectedEntryId("");
            }}
            sx={{ ml: { sm: "auto" } }}
          >
            Reset
          </Button>

          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => window.print()}>
              Print
            </Button>
            <Button variant="outlined" color="inherit" onClick={onClose}>
              Close
            </Button>
          </Stack>
        </Stack>

        {loading && <Typography>Loading…</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading && !error && (
          <Box>
            {/* Summary table */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.6fr 0.6fr 0.6fr",
                gap: 1,
                fontWeight: 700,
                mb: 1,
              }}
            >
              <Box>Month</Box>
              <Box>Cash</Box>
              <Box>Bank</Box>
              <Box>Total</Box>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {monthsSorted.map((m) => {
              const cash = agg[m]?.cash || 0;
              const bank = agg[m]?.bank || 0;
              const total = cash + bank;
              return (
                <Box
                  key={m}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.6fr 0.6fr 0.6fr",
                    gap: 1,
                    py: 0.5,
                  }}
                >
                  <Box>{m}</Box>
                  <Box>₹ {cash.toLocaleString()}</Box>
                  <Box>₹ {bank.toLocaleString()}</Box>
                  <Box>₹ {total.toLocaleString()}</Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Modal>
  );
}
