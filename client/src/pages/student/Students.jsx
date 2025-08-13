import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
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
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ViewStudentModal from "./ViewStudentModal";

const SETTINGS_KEY = "studentsTableSettings";

const Students = () => {
  const { selected: selectedBranch } = useBranch();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [shifts, setShifts] = useState([]);
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

  // Add serial numbers to students data
  const studentsWithSrNo = students.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

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
              <span>{params.value || ""}</span>
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
              <span>{params.value || ""}</span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "class_name",
        headerName: "Class",
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <SchoolIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span>{params.value || ""}</span>
            </Tooltip>
          </Box>
        ),
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
              <span>{params.value || ""}</span>
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
              <span>{params.value || ""}</span>
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
              <span>{params.value || ""}</span>
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
            <FamilyRestroomIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span>{params.value || ""}</span>
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
            <FamilyRestroomIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span>{params.value || ""}</span>
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
              <span>{params.value || ""}</span>
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
              <span>{params.value || ""}</span>
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
              <span>{params.value || ""}</span>
            </Tooltip>
          </Box>
        ),
      },
      {
        field: "admission_end_date",
        headerName: "Admission End Date",
        flex: 0.8,
        minWidth: 160,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
            <CalendarTodayIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={params.value || ""}>
              <span>{params.value || ""}</span>
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
      const data = await window.electronAPI.getStudents(selectedBranch?.id);
      setStudents(data);
    } catch (err) {
      setError("Failed to fetch students", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  const fetchClasses = useCallback(async (branch_id) => {
    try {
      const data = await window.electronAPI.getClassesByBranch(branch_id);
      setClasses(data);
    } catch (err) {
      setError("Failed to fetch classes", err);
    }
  }, []);

  const fetchShifts = useCallback(async () => {
    try {
      const data = await window.electronAPI.getClassShifts();
      setShifts(data);
    } catch (err) {
      setError("Failed to fetch shifts", err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, selectedBranch]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchClasses(selectedBranch.id);
    } else {
      setClasses([]);
    }
  }, [fetchClasses, selectedBranch]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

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
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          + Add Student
        </Button>
      </div>
      <ViewStudentModal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        student={viewingStudent}
        shifts={shifts}
      />

      <Paper elevation={2} sx={{ p: 3 }}>
        {/* <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <PersonIcon sx={{ mr: 1, color: teal[700], fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Students
          </Typography>
        </Box> */}
        <div style={{ width: "100%", height: "70vh" }}>
          {settingsLoaded && (
            <TableWrapper
              columns={columns}
              rows={studentsWithSrNo}
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
      <AddStudentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        classes={classes}
        shifts={shifts}
        onSuccess={handleAddSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <EditStudentModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        student={editingStudent}
        classes={classes}
        shifts={shifts}
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
