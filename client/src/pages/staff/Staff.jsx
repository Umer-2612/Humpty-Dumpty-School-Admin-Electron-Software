import React, { useEffect, useState, useCallback } from "react";
import Button from "@mui/material/Button";
import TableWrapper from "../../component/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import AddTeacherModal from "./AddTeacherModal";
import EditTeacherModal from "./EditTeacherModal";
import DeleteTeacherModal from "./DeleteTeacherModal";

const SETTINGS_KEY = "staffTableSettings";

const Staff = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [shifts, setShifts] = useState([]);
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

  // Add serial numbers to teachers data
  const teachersWithSrNo = teachers.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  const columns = [
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
      field: "class_names",
      headerName: "Classes",
      width: 220,
      renderCell: (params) => (
        <Tooltip
          title={
            Array.isArray(params.row.class_names)
              ? params.row.class_names.join(", ")
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
              {Array.isArray(params.row.class_names)
                ? params.row.class_names.join(", ")
                : "-"}
            </span>
          </Box>
        </Tooltip>
      ),
    },
    {
      field: "shift_names",
      headerName: "Shifts",
      width: 220,
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
      field: "contact",
      headerName: "Contact",
      width: 180,
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
  }, []);

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
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          + Add Teacher
        </Button>
      </div>
      {error && <div className="text-red-600 mb-2 font-medium">{error}</div>}
      {success && (
        <div className="text-green-600 mb-2 font-medium">{success}</div>
      )}
      <Paper elevation={2} sx={{ p: 3, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
      <AddTeacherModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        classes={classes}
        shifts={shifts}
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
