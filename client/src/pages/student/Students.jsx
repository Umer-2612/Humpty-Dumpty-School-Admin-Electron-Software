import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
} from "@mui/material";
import AddStudentModal from "./AddStudentModal";
import EditStudentModal from "./EditStudentModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import Tooltip from "@mui/material/Tooltip";
import TableWrapper from "../../component/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import BadgeIcon from "@mui/icons-material/Badge";
import WcIcon from "@mui/icons-material/Wc";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { useBranch } from "../../context/useBranch";
import { useYear } from "../../context/YearProvider.jsx";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ViewStudentModal from "./ViewStudentModal";

const SETTINGS_KEY = "studentsTableSettings";

const Students = () => {
  const { selected: selectedBranch } = useBranch();
  const { selected: selectedYear } = useYear();
  const [students, setStudents] = useState([]);
  const [classEntries, setClassEntries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportClassId, setReportClassId] = useState("");
  const [reportGender, setReportGender] = useState("");

  // Extract classes from classEntries for reports
  const classes = useMemo(() => {
    return (classEntries || []).map((entry) => ({
      id: entry.class_id || entry.id,
      name: entry.class_name,
      shift_name: entry.shift_name,
      display_name: entry.class_name
        ? `${entry.class_name}${
            entry.shift_name ? ` - ${entry.shift_name}` : ""
          }`
        : entry.class_name || "",
    }));
  }, [classEntries]);

  // Add serial numbers to students data
  const studentsWithSrNo = students.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  // Filtered rows for Report dialog
  const reportFiltered = useMemo(() => {
    let list = students;
    if (reportClassId) {
      list = list.filter(
        (s) => String(s.class_id || s.classId) === String(reportClassId)
      );
    }
    if (reportGender) {
      list = list.filter(
        (s) => String(s.gender || "").toLowerCase() === reportGender
      );
    }
    return list.map((item, index) => {
      const class_display = item.class_name
        ? `${item.class_name}${item.shift_name ? ` - ${item.shift_name}` : ""}${
            item.division ? ` (${item.division})` : ""
          }`
        : item.class_name || "";
      return { ...item, srNo: index + 1, class_display };
    });
  }, [students, reportClassId, reportGender]);

  // Labels for report header summary
  const reportClassLabel = useMemo(() => {
    if (!reportClassId) return "All";
    const c = (classes || []).find(
      (x) => String(x.id) === String(reportClassId)
    );
    return c?.display_name || String(reportClassId);
  }, [reportClassId, classes]);

  const reportGenderLabel = useMemo(() => {
    if (!reportGender) return "All";
    const cap =
      String(reportGender).charAt(0).toUpperCase() +
      String(reportGender).slice(1);
    return cap;
  }, [reportGender]);

  const yearLabel = useMemo(() => {
    const y = selectedYear || {};
    return y.name || y.year_name || y.label || y.title || y.id || "-";
  }, [selectedYear]);

  const branchLabel = useMemo(
    () => selectedBranch?.name || "-",
    [selectedBranch]
  );

  const reportCount = reportFiltered.length;
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
      console.error("Failed to format date:", e);
      return new Date().toISOString();
    }
  }, []);

  // Report modal columns: only 5 fields
  const reportColumns = useMemo(
    () => [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 90,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "name",
        headerName: "Student Name",
        flex: 1,
        minWidth: 160,
      },
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
    ],
    []
  );

  // Build report HTML string (used by Print and Save)
  const buildReportHtml = useCallback(
    (rows) => {
      const columns = [
        { key: "srNo", title: "Sr No" },
        { key: "name", title: "Student Name" },
        { key: "parents_contact1", title: "Parent Contact 1" },
        { key: "parents_contact2", title: "Parent Contact 2" },
        { key: "class_name", title: "Class" },
      ];

      const htmlRows = (rows || [])
        .map((r) => {
          const vals = [
            r.srNo || "",
            r.name || "",
            r.parents_contact1 || "",
            r.parents_contact2 || "",
            r.class_display || "",
          ].map((v) =>
            String(v)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
          );
          return `<tr>${vals.map((v) => `<td>${v}</td>`).join("")}</tr>`;
        })
        .join("");

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Student Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          .header { margin-bottom: 12px; text-align: center; }
          .branch { margin: 0; font-size: 20px; font-weight: 700; }
          .subject { margin: 2px 0 0 0; font-size: 13px; color: #333; }
          .meta { margin: 4px 0 8px 0; font-size: 12px; color: #555; }
          .chips { margin: 6px 0 12px 0; text-align: center; }
          .chip { display: inline-block; border: 1px solid #bbb; border-radius: 12px; padding: 2px 8px; font-size: 11px; margin-right: 6px; margin-bottom: 6px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #999; padding: 6px 8px; font-size: 12px; }
          th { background: #f0f0f0; text-align: left; }
          @media print {
            @page { size: A4; margin: 12mm; }
            thead { display: table-header-group; }
            tfoot { display: table-row-group; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="branch">${branchLabel}</div>
          <div class="subject">Student Report</div>
          <div class="meta">${reportGeneratedAt} • Total: ${reportCount}</div>
          <div class="chips">
            <span class="chip">Branch: ${branchLabel}</span>
            <span class="chip">Year: ${yearLabel}</span>
            <span class="chip">Class: ${reportClassLabel}</span>
            <span class="chip">Gender: ${reportGenderLabel}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>${columns.map((c) => `<th>${c.title}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body>
      </html>`;
      return html;
    },
    [
      branchLabel,
      yearLabel,
      reportClassLabel,
      reportGenderLabel,
      reportGeneratedAt,
      reportCount,
    ]
  );

  // Print: open print dialog with all filtered rows
  const printReport = useCallback(() => {
    const html = buildReportHtml(reportFiltered);
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(
        html.replace(
          "</body>",
          "<script>window.onload = function(){ window.print(); }</script></body>"
        )
      );
      w.document.close();
    }
  }, [reportFiltered, buildReportHtml]);

  const columns = useMemo(
    () => [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 100,
        headerAlign: "center",
        align: "center",
        type: "number",
        disableColumnMenu: true,
      },
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 150,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <PersonIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "roll_number",
        headerName: "Roll No.",
        flex: 0.6,
        minWidth: 90,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <BadgeIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "class_name",
        headerName: "Class",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => {
          const row = params.row;
          const displayText = row.class_name
            ? `${row.class_name}${
                row.shift_name ? ` - ${row.shift_name}` : ""
              }${row.division ? ` (${row.division})` : ""}`
            : row.class_name || "";
          return (
            <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
              <SchoolIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
              <Tooltip title={displayText}>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {displayText}
                </span>
              </Tooltip>
            </Box>
          );
        },
      },
      {
        field: "branch_name",
        headerName: "Branch",
        flex: 0.9,
        minWidth: 140,
        renderCell: (params) => (
          <Tooltip title={params.value || ""}>
            <span>{params.value || ""}</span>
          </Tooltip>
        ),
      },
      {
        field: "parents_contact1",
        headerName: "Parent Contact 1",
        flex: 0.8,
        minWidth: 150,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <PhoneIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "parents_contact2",
        headerName: "Parent Contact 2",
        flex: 0.8,
        minWidth: 150,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <PhoneIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "gender",
        headerName: "Gender",
        flex: 0.5,
        minWidth: 80,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <WcIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "mother_name",
        headerName: "Mother Name",
        flex: 0.8,
        minWidth: 130,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <FamilyRestroomIcon
              sx={{ mr: 1, color: teal[700], fontSize: 18 }}
            />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "father_name",
        headerName: "Father Name",
        flex: 0.8,
        minWidth: 130,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <FamilyRestroomIcon
              sx={{ mr: 1, color: teal[700], fontSize: 18 }}
            />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "fee_scholarship",
        headerName: "Fee Scholarship",
        flex: 0.7,
        minWidth: 130,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <CurrencyRupeeIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "birth_place",
        headerName: "Birth Place",
        flex: 0.7,
        minWidth: 120,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <LocationOnIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "religion",
        headerName: "Religion",
        flex: 0.6,
        minWidth: 100,
        renderCell: (params) => (
          <Tooltip title={params.value || ""}>
            <span>{params.value || ""}</span>
          </Tooltip>
        ),
      },
      {
        field: "admission_date",
        headerName: "Admission Date",
        flex: 0.8,
        minWidth: 140,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <CalendarTodayIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "address",
        headerName: "Address",
        flex: 1.2,
        minWidth: 180,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <LocationOnIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "200px",
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        ),
      },
      // {
      //   field: "created_at",
      //   headerName: "Created At",
      //   flex: 0.8,
      //   minWidth: 130,
      //   renderCell: (params) => (
      //     <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
      //       <CalendarTodayIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
      //       <Tooltip title={params.value || ""}>
      //         <span>{params.value || ""}</span>
      //       </Tooltip>
      //     </Box>
      //   ),
      // },
      {
        field: "actions",
        headerName: "Actions",
        width: 260,
        sortable: false,
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={() => {
                setViewingStudent(params.row);
                setShowViewModal(true);
              }}
            >
              Details
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleEditClick(params.row)}
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
          </Box>
        ),
      },
    ],
    []
  );

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getStudents(
        selectedBranch?.id,
        selectedYear?.id || null
      );
      setStudents(data);
    } catch (err) {
      setError("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, selectedYear]);

  const fetchClassEntries = useCallback(async (branch_id) => {
    try {
      const data = await window.electronAPI.listClassesByBranch(branch_id);
      setClassEntries(data || []);
    } catch (err) {
      setError("Failed to fetch class entries", err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, selectedBranch, selectedYear]);

  // Refresh students when fees are added/edited/deleted elsewhere
  useEffect(() => {
    const onFeesUpdated = () => {
      fetchStudents();
    };
    window.addEventListener("fees-updated", onFeesUpdated);
    return () => window.removeEventListener("fees-updated", onFeesUpdated);
  }, [fetchStudents]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchClassEntries(selectedBranch.id);
    } else {
      setClassEntries([]);
    }
  }, [fetchClassEntries, selectedBranch]);

  useEffect(() => {
    let mounted = true;
    window.electronAPI.getSetting(SETTINGS_KEY).then((settings) => {
      console.log("🔍 [Students] getSetting result:", settings);
      if (mounted && settings) {
        console.log(
          "📊 [Students] columnVisibilityModel:",
          settings.columnVisibilityModel
        );
        setColumnVisibilityModel(settings.columnVisibilityModel || {});
        setSettingsLoaded(true);
      } else if (mounted) {
        // Default visibility: only Name, Roll No, Class, Address, and Actions
        const defaultVisible = new Set([
          "name",
          "roll_number",
          "class_name",
          "address",
          "actions",
        ]);
        const model = {};
        (columns || []).forEach((col) => {
          if (!defaultVisible.has(col.field)) model[col.field] = false;
        });
        setColumnVisibilityModel(model);
        setSettingsLoaded(true);
        // Persist default once so user can tweak later
        window.electronAPI.setSetting(SETTINGS_KEY, {
          columnVisibilityModel: model,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [columns]);

  const handleColumnVisibilityModelChange = useCallback((newModel) => {
    console.log("🔄 [Students] Column visibility changed:", newModel);
    setColumnVisibilityModel((prev) => {
      // shallow compare to avoid redundant state updates
      const prevKeys = Object.keys(prev || {});
      const newKeys = Object.keys(newModel || {});
      if (prevKeys.length === newKeys.length) {
        let same = true;
        for (const k of newKeys) {
          if (prev[k] !== newModel[k]) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      // persist only when actually changed
      window.electronAPI.setSetting(SETTINGS_KEY, {
        columnVisibilityModel: newModel,
      });
      return newModel;
    });
  }, []);

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (student) => {
    console.log("🟡 [FRONTEND] Students.jsx: handleDeleteClick called");
    console.log("🟡 [FRONTEND] Student to delete:", student);
    setDeletingStudent(student);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
    console.log(
      "🟡 [FRONTEND] Delete modal opened for student ID:",
      student?.id
    );
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setSuccess("Student added successfully!");
    fetchStudents();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingStudent(null);
    setSuccess("Student updated successfully!");
    fetchStudents();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDeleteSuccess = () => {
    console.log("🟢 [FRONTEND] Students.jsx: handleDeleteSuccess called");
    setShowDeleteModal(false);
    setDeletingStudent(null);
    setSuccess("Student deleted successfully!");
    console.log("🟢 [FRONTEND] Calling fetchStudents() to refresh table");
    fetchStudents();
    setTimeout(() => setSuccess(""), 2000);
    console.log("🟢 [FRONTEND] Delete success handling completed");
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
        <h1 className="text-2xl font-bold">Students</h1>
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setReportOpen(true)}
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
            + Add Student
          </Button>
        </Stack>
      </div>
      <ViewStudentModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        student={viewingStudent}
      />

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
        {/* <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: teal[700], fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Students
          </Typography>
        </Box> */}
        <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
          {settingsLoaded && (
            <TableWrapper
              columns={columns}
              rows={studentsWithSrNo}
              pageSize={10}
              pageSizeOptions={[10]}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              initialState={{
                sorting: { sortModel: [{ field: "srNo", sort: "asc" }] },
              }}
            />
          )}
        </div>
      </Paper>
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        classEntries={classEntries}
        onSuccess={handleAddSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <EditStudentModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        student={editingStudent}
        classEntries={classEntries}
        onSuccess={handleEditSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        student={deletingStudent}
        onSuccess={handleDeleteSuccess}
        setError={setError}
        setLoading={setLoading}
      />

      {/* Report Dialog */}
      <Dialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
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
              <SchoolIcon sx={{ color: teal[700] }} />
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, lineHeight: 1 }}
                >
                  Student Report
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
            <Chip size="small" label={`Class: ${reportClassLabel}`} />
            <Chip size="small" label={`Gender: ${reportGenderLabel}`} />
          </Stack>
          <Divider sx={{ mb: 2 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="report-class-label">Class</InputLabel>
              <Select
                labelId="report-class-label"
                label="Class"
                value={reportClassId}
                onChange={(e) => setReportClassId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {(classes || []).map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.display_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="report-gender-label">Gender</InputLabel>
              <Select
                labelId="report-gender-label"
                label="Gender"
                value={reportGender}
                onChange={(e) => setReportGender(e.target.value)}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="text"
              color="inherit"
              onClick={() => {
                setReportClassId("");
                setReportGender("");
              }}
              sx={{ ml: "auto" }}
            >
              Reset
            </Button>
          </Stack>

          {/* Live count hint above table */}
          <Typography variant="caption" sx={{ mb: 1, color: "text.secondary" }}>
            Showing {reportCount} result(s)
          </Typography>
          <div style={{ width: "100%", height: "60vh" }}>
            <TableWrapper
              columns={reportColumns}
              rows={reportFiltered}
              pagination={false}
              hidePageSize={true}
              enableExport={false}
              initialState={{
                sorting: { sortModel: [{ field: "name", sort: "asc" }] },
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="primary" onClick={printReport}>
            Print
          </Button>
          <Button onClick={() => setReportOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ zIndex: 9999 }}
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

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ zIndex: 9999 }}
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
    </div>
  );
};

export default Students;
