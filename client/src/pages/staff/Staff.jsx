import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import TableWrapper from "../../component/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import AddTeacherModal from "./AddTeacherModal";
import EditTeacherModal from "./EditTeacherModal";
import DeleteTeacherModal from "./DeleteTeacherModal";
import { useBranch } from "../../context/useBranch";
import { useYear } from "../../context/YearProvider.jsx";

const SETTINGS_KEY = "staffTableSettings";

const Staff = () => {
  const { selected: activeBranch } = useBranch() || {};
  const { selected: selectedYear } = useYear() || {};
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [classEntries, setClassEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTeacherId, setReportTeacherId] = useState("");
  const [students, setStudents] = useState([]);

  // Add serial numbers to teachers data
  const teachersWithSrNo = teachers.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  const calcMinWidth = (title) =>
    Math.max(80, 9 * String(title || "").length + 24);

  const columns = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 100,
      minWidth: calcMinWidth("Sr No"),
      headerAlign: "center",
      align: "center",
      type: "number",
      disableColumnMenu: true,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: calcMinWidth("Name"),
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PersonIcon sx={{ mr: 1, color: teal[700] }} />
          <Tooltip title={params.value}>
            <span>{params.value}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "shift_names",
      headerName: "Shifts",
      width: 220,
      minWidth: calcMinWidth("Shifts"),
      renderCell: (params) => (
        <Tooltip
          title={
            Array.isArray(params.row.shift_names)
              ? params.row.shift_names.join(", ")
              : "-"
          }
        >
          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <span
              style={{
                display: "inline-block",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                verticalAlign: "bottom",
              }}
            >
              {Array.isArray(params.row.shift_names)
                ? params.row.shift_names.join(", ")
                : "-"}
            </span>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "assignments_display",
      headerName: "Class",
      flex: 1.2,
      minWidth: calcMinWidth("Class"),
      renderCell: (params) => {
        const items = Array.isArray(params.row.assignments)
          ? params.row.assignments
              .filter((a) => a && (a.class_name || a.class_id))
              .map((a) => {
                const classPart = a.class_name || `Class #${a.class_id}`;
                const divPart = a.division ? `-${a.division}` : "";
                const timeStr =
                  a.start_time && a.end_time
                    ? `${a.start_time} - ${a.end_time}`
                    : a.start_time || a.end_time || "-";
                const shiftPart = a.shift_name
                  ? `${a.shift_name} (${timeStr})`
                  : "";
                return `${classPart}${divPart}${
                  shiftPart ? ` | ${shiftPart}` : ""
                }`;
              })
          : [];
        const text = items.length ? items.join(", ") : "-";
        return (
          <Tooltip title={text}>
            <Box sx={{ width: "100%", overflow: "hidden" }}>
              <span
                style={{
                  display: "inline-block",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  verticalAlign: "bottom",
                }}
              >
                {text}
              </span>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: "contact",
      headerName: "Contact",
      width: 180,
      minWidth: calcMinWidth("Contact"),
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PhoneIcon sx={{ mr: 1, color: teal[700] }} />
          <Tooltip title={params.value}>
            <span>{params.value}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      minWidth: calcMinWidth("Actions"),
      sortable: false,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getTeachers();
      setTeachers(data);
    } catch (err) {
      setError("Failed to fetch teachers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    window.electronAPI.getClasses().then(setClasses);
    window.electronAPI.getClassShifts().then(setShifts);
    // Load unified class entries (aggregate across branches if multiple)
    (async () => {
      try {
        const branches = await window.electronAPI.getBranches();
        const lists = await Promise.all(
          (branches || []).map((b) =>
            window.electronAPI.listClassEntriesByBranch(b.id)
          )
        );
        setClassEntries([].concat(...lists.filter(Boolean)));
      } catch (err) {
        console.error("Error loading class entries:", err);
        setClassEntries([]);
      }
    })();
  }, []);

  // Load students when opening report
  useEffect(() => {
    const load = async () => {
      if (!reportOpen) return;
      const branchId = activeBranch?.id;
      if (!branchId) return;
      try {
        const ayId = selectedYear?.id || null;
        const list = await window.electronAPI.getStudents(branchId, ayId);
        setStudents(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Failed to load students for report:", e);
        setStudents([]);
      }
    };
    load();
  }, [reportOpen, activeBranch?.id, selectedYear?.id]);

  const shiftsById = useMemo(() => {
    const map = new Map();
    (shifts || []).forEach((s) => map.set(String(s.id), s));
    return map;
  }, [shifts]);

  const classesById = useMemo(() => {
    const map = new Map();
    (classes || []).forEach((c) => map.set(String(c.id), c));
    return map;
  }, [classes]);

  const selectedTeacher = useMemo(
    () =>
      (teachers || []).find((t) => String(t.id) === String(reportTeacherId)),
    [teachers, reportTeacherId]
  );

  const reportRows = useMemo(() => {
    if (!Array.isArray(students) || !selectedTeacher) return [];
    const assignments = Array.isArray(selectedTeacher.assignments)
      ? selectedTeacher.assignments
      : [];
    if (!assignments.length) return [];
    const rows = students.filter((stu) => {
      const sClassId = String(stu.class_id || stu.classId || "");
      const sShiftId = String(stu.shift_id || stu.shiftId || "");
      const sDiv = stu.division || "";
      return assignments.some((a) => {
        const aClassId = String(a.class_id || a.classId || "");
        const aShiftId = String(a.shift_id || a.shiftId || "");
        const aDiv = a.division || ""; // empty means any division
        return (
          aClassId &&
          aShiftId &&
          aClassId === sClassId &&
          aShiftId === sShiftId &&
          (aDiv === "" || aDiv === sDiv)
        );
      });
    });
    return rows.map((r, idx) => {
      const classObj = classesById.get(String(r.class_id));
      const className =
        r.class_name || classObj?.name || classObj?.class_name || "";
      const class_display = className
        ? `${className}${r.division ? ` (${r.division})` : ""}`
        : className;
      const s = shiftsById.get(String(r.shift_id));
      const time =
        s && s.start_time && s.end_time
          ? `${s.start_time} - ${s.end_time}`
          : s?.time || "";
      const shift_display = s
        ? `${s.name || s.shift_name || ""}${time ? ` (${time})` : ""}`
        : "";
      return {
        ...r,
        srNo: idx + 1,
        class_display,
        shift_display,
      };
    });
  }, [students, selectedTeacher, shiftsById, classesById]);

  const reportCount = reportRows.length;

  // Labels and meta similar to Students report
  const branchLabel = useMemo(
    () => activeBranch?.name || activeBranch?.branch_name || "-",
    [activeBranch]
  );
  const yearLabel = useMemo(() => {
    const y = selectedYear || {};
    return y.name || y.year_name || y.label || y.title || y.id || "-";
  }, [selectedYear]);
  const reportGeneratedAt = useMemo(() => {
    try {
      return new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Failed to format date for report:", e);
      return new Date().toISOString();
    }
  }, []);

  const handleOpenReport = () => {
    setReportTeacherId("");
    setReportOpen(true);
  };
  const handleCloseReport = () => setReportOpen(false);

  const handlePrintReport = () => {
    const teacherName = selectedTeacher?.name || "-";
    const generatedAt = new Date().toLocaleString();
    const htmlRows = reportRows
      .map((r) => {
        const cells = [
          r.srNo,
          r.name,
          r.parents_contact1 || "",
          r.parents_contact2 || "",
          r.class_display,
          r.shift_display,
        ].map((v) =>
          String(v || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
        );
        return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`;
      })
      .join("");
    const html = `<!doctype html>
    <html><head><meta charset="utf-8" /><title>Teacher Student Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      .header { text-align: center; margin-bottom: 12px; }
      .branch { margin: 0; font-weight: 700; font-size: 20px; }
      .subject { margin: 2px 0 0 0; font-size: 13px; color: #333; }
      .meta { margin: 4px 0 8px 0; font-size: 12px; color: #555; }
      .chips { text-align: center; margin: 6px 0 12px 0; }
      .chip { display: inline-block; border: 1px solid #bbb; border-radius: 12px; padding: 2px 8px; font-size: 11px; margin-right: 6px; margin-bottom: 6px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; }
      th { background: #f0f0f0; text-align: left; }
      @media print { @page { size: A4; margin: 12mm; } thead { display: table-header-group; } }
    </style></head>
    <body>
      <div class="header">
        <div class="branch">${branchLabel}</div>
        <div class="subject">Subject: Teacher-wise Student Report</div>
        <div class="meta">${generatedAt} • Teacher: ${teacherName} • Total: ${reportCount}</div>
        <div class="chips">
          <span class="chip">Branch: ${branchLabel}</span>
          <span class="chip">Year: ${yearLabel}</span>
          <span class="chip">Teacher: ${teacherName}</span>
        </div>
      </div>
      <table>
        <thead><tr><th>Sr No</th><th>Name</th><th>Parent Contact 1</th><th>Parent Contact 2</th><th>Class</th><th>Shift</th></tr></thead>
        <tbody>${htmlRows}</tbody>
      </table>
    </body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  useEffect(() => {
    let mounted = true;
    window.electronAPI.getSetting(SETTINGS_KEY).then((settings) => {
      if (mounted && settings) {
        setColumnVisibilityModel(settings.columnVisibilityModel || {});
      }
      setSettingsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleColumnVisibilityModelChange = useCallback((newModel) => {
    setColumnVisibilityModel(newModel);
    window.electronAPI.setSetting(SETTINGS_KEY, {
      columnVisibilityModel: newModel,
    });
  }, []);

  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher);
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (teacher) => {
    setDeletingTeacher(teacher);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
  };

  const handleAddTeacherSuccess = () => {
    setShowAddModal(false);
    setSuccess("Teacher added successfully!");
    fetchTeachers();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleEditTeacherSuccess = () => {
    setShowEditModal(false);
    setEditingTeacher(null);
    setSuccess("Teacher updated successfully!");
    fetchTeachers();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDeleteTeacherSuccess = () => {
    setShowDeleteModal(false);
    setDeletingTeacher(null);
    setSuccess("Teacher deleted successfully!");
    fetchTeachers();
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleOpenReport}
            disabled={loading}
          >
            Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddModal(true)}
            disabled={loading}
          >
            + Add Teacher
          </Button>
        </Stack>
      </div>
      {/* Toast notifications */}
      <Snackbar
        open={Boolean(success)}
        autoHideDuration={2000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccess("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={3000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
          {settingsLoaded && (
            <TableWrapper
              columns={columns}
              rows={teachersWithSrNo}
              pageSize={10}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              initialState={{
                sorting: { sortModel: [{ field: "srNo", sort: "asc" }] },
              }}
            />
          )}
        </div>
      </Paper>
      {/* Report Dialog */}
      <Dialog
        open={reportOpen}
        onClose={handleCloseReport}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <PersonIcon sx={{ color: teal[700] }} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, lineHeight: 1 }}
                >
                  Teacher-wise Student Report
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {reportGeneratedAt} • Total: {reportCount}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {/* Filter chips summary */}
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={`Branch: ${branchLabel}`} />
            <Chip size="small" label={`Year: ${yearLabel}`} />
            {selectedTeacher && (
              <Chip size="small" label={`Teacher: ${selectedTeacher.name}`} />
            )}
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="report-teacher-label">Teacher</InputLabel>
              <Select
                labelId="report-teacher-label"
                label="Teacher"
                value={reportTeacherId}
                onChange={(e) => setReportTeacherId(e.target.value)}
              >
                {(teachers || []).map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <div style={{ width: "100%", height: 420 }}>
            <TableWrapper
              rows={reportRows}
              columns={[
                {
                  field: "srNo",
                  headerName: "Sr No",
                  width: 90,
                  align: "center",
                  headerAlign: "center",
                },
                { field: "name", headerName: "Name", flex: 1, minWidth: 160 },
                {
                  field: "parents_contact1",
                  headerName: "Parent Contact 1",
                  flex: 0.8,
                  minWidth: 140,
                },
                {
                  field: "parents_contact2",
                  headerName: "Parent Contact 2",
                  flex: 0.8,
                  minWidth: 140,
                },
                {
                  field: "class_display",
                  headerName: "Class",
                  flex: 0.8,
                  minWidth: 120,
                },
                {
                  field: "shift_display",
                  headerName: "Shift",
                  flex: 0.8,
                  minWidth: 120,
                },
              ]}
              pageSize={reportRows.length || 10}
              pagination={false}
              hidePageSize
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintReport} disabled={!selectedTeacher}>
            Print
          </Button>
          <Button onClick={handleCloseReport}>Close</Button>
        </DialogActions>
      </Dialog>
      <AddTeacherModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        classes={classes}
        shifts={shifts}
        classEntries={classEntries}
        onSuccess={handleAddTeacherSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <EditTeacherModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        teacher={editingTeacher}
        classes={classes}
        shifts={shifts}
        classEntries={classEntries}
        onSuccess={handleEditTeacherSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <DeleteTeacherModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        teacher={deletingTeacher}
        onSuccess={handleDeleteTeacherSuccess}
        setError={setError}
        setLoading={setLoading}
      />
    </div>
  );
};

export default Staff;
