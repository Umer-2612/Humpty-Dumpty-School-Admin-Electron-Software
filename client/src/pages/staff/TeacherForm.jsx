import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import ListItemText from "@mui/material/ListItemText";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DoneOutlinedIcon from "@mui/icons-material/DoneOutlined";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";

const TeacherForm = ({
  form,
  setForm,
  classes = [],
  shifts = [],
  classEntries = [],
  isEditing = false,
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Helpers for Assignments rows
  const handleRowChange = (idx, key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev) => {
      const rows = [...(prev.assignmentsRows || [])];
      const nextRow = { ...(rows[idx] || {}), [key]: value };
      // If selecting a class in legacy mode, default to all shifts when none selected
      if (!unifiedMode && key === "classId") {
        const allShiftIds = (shifts || []).map((s) => s.id);
        if (!nextRow.shiftIds || nextRow.shiftIds.length === 0) {
          nextRow.shiftIds = allShiftIds;
        }
      }
      rows[idx] = nextRow;
      return { ...prev, assignmentsRows: rows };
    });
  };

  const addRow = () => {
    setForm((prev) => ({
      ...prev,
      assignmentsRows: [
        ...(prev.assignmentsRows || []),
        unifiedMode
          ? { classEntryId: "", divisions: [] }
          : {
              classId: "",
              divisions: [],
              // Default to both shifts (all available) by default
              shiftIds: (shifts || []).map((s) => s.id),
            },
      ],
    }));
  };

  const removeRow = (idx) => () => {
    setForm((prev) => {
      const rows = [...(prev.assignmentsRows || [])];
      rows.splice(idx, 1);
      return { ...prev, assignmentsRows: rows };
    });
  };

  const unifiedMode = Array.isArray(classEntries) && classEntries.length > 0;

  const getClassById = (id) => classes.find((c) => c.id === id);
  const getEntryById = (id) => classEntries.find((e) => e.id === id);

  const getDivisionOptions = (classId, classEntryId) => {
    let count = 0;
    if (unifiedMode) {
      const entry = getEntryById(classEntryId);
      count = Number(entry?.division_count || 0);
    } else {
      const cls = getClassById(classId);
      count = Number(cls?.num_divisions || 0);
    }
    const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return Array.from(
      { length: Math.max(0, count) },
      (_, i) => base[i] || String(i + 1)
    );
  };

  const [openState, setOpenState] = useState({});
  const [expanded, setExpanded] = useState({}); // idx -> boolean
  const setOpen = (key, val) =>
    setOpenState((prev) => ({ ...prev, [key]: val }));

  const toggleExpanded = (idx, next) => {
    setExpanded((prev) => ({
      ...prev,
      [idx]: typeof next === "boolean" ? next : !prev[idx],
    }));
  };

  // Backfill: when shifts load/change in legacy mode, ensure empty shift selections default to all
  useEffect(() => {
    if (unifiedMode) return;
    setForm((prev) => {
      const allShiftIds = (shifts || []).map((s) => s.id);
      const rows = (prev.assignmentsRows || []).map((r) => {
        if (!r || (r.shiftIds && r.shiftIds.length)) return r;
        return { ...r, shiftIds: allShiftIds };
      });
      return { ...prev, assignmentsRows: rows };
    });
  }, [shifts, unifiedMode, setForm]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleInputChange}
          fullWidth
          required
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
          autoFocus={!isEditing}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Contact"
          name="contact"
          value={form.contact}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      {/* Office Staff toggle */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!form.isOfficeStaff}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  isOfficeStaff: e.target.checked,
                }))
              }
              color="primary"
              size="small"
            />
          }
          label="Office Staff (no class/shift)"
        />
      </Grid>
      {!form.isOfficeStaff && (
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Assignments
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {(form.assignmentsRows || []).map((row, idx) => {
              const selectedEntry = unifiedMode
                ? getEntryById(row.classEntryId)
                : null;
              const selectedClass = unifiedMode
                ? null
                : getClassById(row.classId);
              const divisionOptions = unifiedMode
                ? getDivisionOptions(null, row.classEntryId)
                : getDivisionOptions(row.classId, null);
              const hasDivisions = (divisionOptions || []).length > 0;
              const selectedClassIds = unifiedMode
                ? (form.assignmentsRows || [])
                    .map((r, i) => (i === idx ? null : r.classEntryId))
                    .filter(Boolean)
                : (form.assignmentsRows || [])
                    .map((r, i) => (i === idx ? null : r.classId))
                    .filter(Boolean);
              const availableClasses = unifiedMode
                ? classEntries.filter(
                    (e) =>
                      !selectedClassIds.includes(e.id) ||
                      e.id === row.classEntryId
                  )
                : classes.filter(
                    (cls) =>
                      !selectedClassIds.includes(cls.id) ||
                      cls.id === row.classId
                  );
              const classTooltip = (() => {
                if (unifiedMode) {
                  const label = selectedEntry
                    ? `${selectedEntry.class_name} - ${selectedEntry.shift_name}`
                    : null;
                  return label
                    ? `Class & Shift: ${label}`
                    : "Select class & shift";
                }
                const name = selectedClass?.class_name;
                return name ? `Class: ${name}` : "Select a class";
              })();
              const divisionTooltip = (() => {
                if (!hasDivisions) return "This class has no divisions";
                const sel = row.divisions || [];
                return sel.length
                  ? `Divisions: ${sel.join(", ")}`
                  : `Select division(s) (${divisionOptions.length} total)`;
              })();
              const shiftsTooltip = unifiedMode
                ? (() => {
                    if (!selectedEntry) return "Select class & shift";
                    const time =
                      selectedEntry.start_time && selectedEntry.end_time
                        ? `${selectedEntry.start_time} - ${selectedEntry.end_time}`
                        : "-";
                    return `Shift: ${selectedEntry.shift_name} (${time})`;
                  })()
                : (() => {
                    const sel = row.shiftIds || [];
                    if (!sel.length) return "Select shift(s)";
                    const labels = shifts
                      .filter((s) => sel.includes(s.id))
                      .map((s) => {
                        const time =
                          s.start_time && s.end_time
                            ? `${s.start_time} - ${s.end_time}`
                            : s.time || "-";
                        return `${s.name} (${time})`;
                      });
                    return `Shifts: ${labels.join(", ")}`;
                  })();
              const classKey = `class-${idx}`;
              const divKey = `division-${idx}`;
              const shiftKey = `shift-${idx}`;

              const emptyState = unifiedMode
                ? !row.classEntryId ||
                  (!!hasDivisions && !(row.divisions || []).length)
                : !row.classId ||
                  (!!hasDivisions && !(row.divisions || []).length) ||
                  !(row.shiftIds || []).length;
              const isExpanded = expanded[idx] ?? emptyState;

              return (
                <Paper
                  key={idx}
                  sx={{
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: "#fff",
                    border: "1px solid #f0f0f0",
                    transition:
                      "border-color 120ms ease, box-shadow 120ms ease",
                    "&:hover": {
                      borderColor: "#e0e0e0",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  {/* Header summary with chips */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    sx={{ mb: isExpanded ? 0.75 : 0 }}
                  >
                    {/* Class Chip */}
                    <Tooltip
                      title={classTooltip}
                      disableHoverListener={isExpanded || !!openState[classKey]}
                      disableFocusListener={isExpanded || !!openState[classKey]}
                      enterDelay={350}
                      placement="top"
                    >
                      <Chip
                        label={
                          unifiedMode
                            ? selectedEntry
                              ? `${selectedEntry.class_name} — ${selectedEntry.shift_name}`
                              : "Select class & shift"
                            : selectedClass
                            ? selectedClass.class_name
                            : "Select class"
                        }
                        variant="outlined"
                        size="small"
                        clickable
                        onClick={() => toggleExpanded(idx, true)}
                      />
                    </Tooltip>
                    {/* Divisions Chips */}
                    <Tooltip
                      title={divisionTooltip}
                      disableHoverListener={isExpanded || !!openState[divKey]}
                      disableFocusListener={isExpanded || !!openState[divKey]}
                      enterDelay={350}
                      placement="top"
                    >
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{ flexWrap: "wrap" }}
                        onClick={() => toggleExpanded(idx, true)}
                      >
                        {hasDivisions ? (
                          (row.divisions && row.divisions.length
                            ? row.divisions
                            : ["Divisions"]
                          )
                            .slice(0, 3)
                            .map((d) => (
                              <Chip
                                key={d}
                                label={d}
                                size="small"
                                variant="outlined"
                                clickable
                              />
                            ))
                        ) : (
                          <Chip
                            label="No divisions"
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {row.divisions && row.divisions.length > 3 && (
                          <Chip
                            label={`+${row.divisions.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Tooltip>
                    {/* Shifts Chips */}
                    {!unifiedMode && (
                      <Tooltip
                        title={shiftsTooltip}
                        disableHoverListener={
                          isExpanded || !!openState[shiftKey]
                        }
                        disableFocusListener={
                          isExpanded || !!openState[shiftKey]
                        }
                        enterDelay={350}
                        placement="top"
                      >
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ flexWrap: "wrap" }}
                          onClick={() => toggleExpanded(idx, true)}
                        >
                          {(row.shiftIds && row.shiftIds.length
                            ? shifts.filter((s) => row.shiftIds.includes(s.id))
                            : [{ id: "__none__", name: "Shifts" }]
                          )
                            .slice(0, 3)
                            .map((s) => (
                              <Chip
                                key={s.id || s.name}
                                label={s.name}
                                size="small"
                                variant="outlined"
                                clickable
                              />
                            ))}
                          {row.shiftIds && row.shiftIds.length > 3 && (
                            <Chip
                              label={`+${row.shiftIds.length - 3}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Tooltip>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title={isExpanded ? "Done" : "Edit"}>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpanded(idx)}
                      >
                        {isExpanded ? (
                          <DoneOutlinedIcon fontSize="small" />
                        ) : (
                          <EditOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove this assignment row">
                      <IconButton
                        aria-label="remove assignment"
                        color="error"
                        size="small"
                        onClick={removeRow(idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {/* Inline editor */}
                  {isExpanded && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.75,
                      }}
                    >
                      {/* Class / Class & Shift Selector */}
                      {unifiedMode ? (
                        <Tooltip
                          title={classTooltip}
                          disableHoverListener={!!openState[classKey]}
                          disableFocusListener={!!openState[classKey]}
                          enterDelay={600}
                          placement="top"
                        >
                          <FormControl
                            required
                            variant="outlined"
                            size="small"
                            sx={{ width: "100%", maxWidth: 360 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ mb: 0.25, color: "text.secondary" }}
                            >
                              Class & Shift
                            </Typography>
                            <Select
                              value={row.classEntryId || ""}
                              onChange={handleRowChange(idx, "classEntryId")}
                              onOpen={() => setOpen(classKey, true)}
                              onClose={() => setOpen(classKey, false)}
                              size="small"
                              sx={{
                                bgcolor: "white",
                                "& .MuiSelect-select": {
                                  minHeight: 36,
                                  display: "flex",
                                  alignItems: "center",
                                },
                              }}
                              MenuProps={{
                                MenuListProps: { dense: true },
                                PaperProps: {
                                  sx: { "& .MuiMenuItem-root": { py: 0.5 } },
                                },
                              }}
                            >
                              {availableClasses.map((e) => {
                                const time =
                                  e.start_time && e.end_time
                                    ? `${e.start_time} - ${e.end_time}`
                                    : "-";
                                return (
                                  <MenuItem
                                    key={e.id}
                                    value={e.id}
                                    sx={{ py: 0.25 }}
                                  >
                                    <ListItemText
                                      primary={`${e.class_name} — ${e.shift_name}`}
                                      secondary={time}
                                    />
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title={classTooltip}
                          disableHoverListener={!!openState[classKey]}
                          disableFocusListener={!!openState[classKey]}
                          enterDelay={600}
                          placement="top"
                        >
                          <FormControl
                            required
                            variant="outlined"
                            size="small"
                            sx={{ width: "100%", maxWidth: 360 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ mb: 0.25, color: "text.secondary" }}
                            >
                              Class
                            </Typography>
                            <Select
                              value={row.classId || ""}
                              onChange={handleRowChange(idx, "classId")}
                              onOpen={() => setOpen(classKey, true)}
                              onClose={() => setOpen(classKey, false)}
                              size="small"
                              sx={{
                                bgcolor: "white",
                                "& .MuiSelect-select": {
                                  minHeight: 36,
                                  display: "flex",
                                  alignItems: "center",
                                },
                              }}
                              MenuProps={{
                                MenuListProps: { dense: true },
                                PaperProps: {
                                  sx: { "& .MuiMenuItem-root": { py: 0.5 } },
                                },
                              }}
                            >
                              {availableClasses.map((cls) => (
                                <MenuItem
                                  key={cls.id}
                                  value={cls.id}
                                  sx={{ py: 0.25 }}
                                >
                                  <ListItemText primary={cls.class_name} />
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      )}

                      <Tooltip
                        title={divisionTooltip}
                        disableHoverListener={!!openState[divKey]}
                        disableFocusListener={!!openState[divKey]}
                        enterDelay={600}
                        placement="top"
                      >
                        <FormControl
                          variant="outlined"
                          size="small"
                          disabled={!hasDivisions}
                          sx={{ width: "100%", maxWidth: 360 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ mb: 0.25, color: "text.secondary" }}
                          >
                            {hasDivisions ? "Division(s)" : "No Divisions"}
                          </Typography>
                          <Select
                            multiple
                            value={row.divisions || []}
                            onChange={handleRowChange(idx, "divisions")}
                            onOpen={() => setOpen(divKey, true)}
                            onClose={() => setOpen(divKey, false)}
                            size="small"
                            sx={{
                              bgcolor: "white",
                              "& .MuiSelect-select": {
                                minHeight: 36,
                                display: "flex",
                                alignItems: "center",
                              },
                            }}
                            renderValue={(selected) =>
                              selected && selected.length
                                ? (selected || []).join(", ")
                                : undefined
                            }
                            MenuProps={{
                              MenuListProps: { dense: true },
                              PaperProps: {
                                sx: { "& .MuiMenuItem-root": { py: 0.5 } },
                              },
                            }}
                          >
                            {divisionOptions.map((d) => (
                              <MenuItem key={d} value={d} sx={{ py: 0.25 }}>
                                <Checkbox
                                  checked={
                                    (row.divisions || []).indexOf(d) > -1
                                  }
                                  size="small"
                                />
                                <ListItemText primary={d} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Tooltip>

                      {/* Shifts multi-select (legacy only) */}
                      {!unifiedMode && (
                        <Tooltip
                          title={shiftsTooltip}
                          disableHoverListener={!!openState[shiftKey]}
                          disableFocusListener={!!openState[shiftKey]}
                          enterDelay={600}
                          placement="top"
                        >
                          <FormControl
                            required
                            variant="outlined"
                            size="small"
                            sx={{ width: "100%", maxWidth: 360 }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ mb: 0.25, color: "text.secondary" }}
                            >
                              Shift(s)
                            </Typography>
                            <Select
                              multiple
                              value={row.shiftIds || []}
                              onChange={handleRowChange(idx, "shiftIds")}
                              onOpen={() => setOpen(shiftKey, true)}
                              onClose={() => setOpen(shiftKey, false)}
                              size="small"
                              sx={{
                                bgcolor: "white",
                                "& .MuiSelect-select": {
                                  minHeight: 36,
                                  display: "flex",
                                  alignItems: "center",
                                },
                              }}
                              renderValue={(selected) =>
                                selected && selected.length
                                  ? shifts
                                      .filter((s) => selected.includes(s.id))
                                      .map((s) => {
                                        const time =
                                          s.start_time && s.end_time
                                            ? `${s.start_time} - ${s.end_time}`
                                            : s.time || "-";
                                        return `${s.name} (${time})`;
                                      })
                                      .join(", ")
                                  : undefined
                              }
                              MenuProps={{
                                MenuListProps: { dense: true },
                                PaperProps: {
                                  sx: { "& .MuiMenuItem-root": { py: 0.5 } },
                                },
                              }}
                            >
                              {shifts.map((s) => {
                                const time =
                                  s.start_time && s.end_time
                                    ? `${s.start_time} - ${s.end_time}`
                                    : s.time || "-";
                                return (
                                  <MenuItem
                                    key={s.id}
                                    value={s.id}
                                    sx={{ py: 0.25 }}
                                  >
                                    <Checkbox
                                      checked={
                                        (row.shiftIds || []).indexOf(s.id) > -1
                                      }
                                      size="small"
                                    />
                                    <ListItemText
                                      primary={`${s.name} (${time})`}
                                    />
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })}
            <Box>
              <Tooltip title="Add another assignment row">
                <IconButton
                  aria-label="add assignment"
                  color="primary"
                  onClick={addRow}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

export default TeacherForm;
