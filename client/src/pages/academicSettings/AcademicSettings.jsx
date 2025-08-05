import React, { useEffect, useState, useCallback } from "react";
import Button from "@mui/material/Button";
import TableWrapper from "../../component/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { teal } from "@mui/material/colors";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AddClassModal from "./AddClassModal";
import EditClassModal from "./EditClassModal";
import DeleteClassModal from "./DeleteClassModal";
import AddShiftModal from "./AddShiftModal";
import EditShiftModal from "./EditShiftModal";
import DeleteShiftModal from "./DeleteShiftModal";
import { useBranch } from "../../context/useBranch";

const SETTINGS_KEY = "academicSettingsTableSettings";

const AcademicSettings = () => {
  const { selected: selectedBranch } = useBranch();
  const [classes, setClasses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Add serial numbers to classes data
  const classesWithSrNo = classes.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  const classColumns = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 70,
      headerAlign: "center",
      align: "center",
      type: "number",
    },
    {
      field: "name",
      headerName: "Class Name",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <SchoolIcon sx={{ mr: 1, color: teal[700] }} />
          <Tooltip title={params.value}>
            <span>{params.value}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "total_fees",
      headerName: "Total Fees",
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CurrencyRupeeIcon sx={{ mr: 1, color: teal[700] }} />
          <Tooltip title={Number(params.value).toLocaleString()}>
            <span>{Number(params.value).toLocaleString()}</span>
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
            onClick={() => handleEditClassClick(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteClassClick(params.row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // Add serial numbers to shifts data
  const shiftsWithSrNo = shifts.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  const shiftColumns = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 70,
      headerAlign: "center",
      align: "center",
      type: "number",
    },
    {
      field: "name",
      headerName: "Shift Name",
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <AccessTimeIcon sx={{ mr: 1, color: teal[700] }} />
          <Tooltip title={params.value}>
            <span>{params.value}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "time",
      headerName: "Time",
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value || "-"}</span>
        </Tooltip>
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
            onClick={() => handleEditShiftClick(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteShiftClick(params.row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

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

  const fetchClasses = useCallback(async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      const data = await window.electronAPI.getClassesByBranch(
        selectedBranch.id
      );
      setClasses(data);
    } catch (err) {
      setError("Failed to fetch classes", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getClassShifts();
      console.log({ data });
      setShifts(data);
    } catch (err) {
      setError("Failed to fetch shifts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses, selectedBranch]);

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleEditClassClick = (cls) => {
    setEditingClass(cls);
    setShowEditClassModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClassClick = (cls) => {
    setDeletingClass(cls);
    setShowDeleteClassModal(true);
    setError("");
    setSuccess("");
  };

  const handleEditShiftClick = (shift) => {
    setEditingShift(shift);
    setShowEditShiftModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteShiftClick = (shift) => {
    setDeletingShift(shift);
    setShowDeleteShiftModal(true);
    setError("");
    setSuccess("");
  };

  const handleAddClassSuccess = () => {
    setShowClassModal(false);
    setSuccess("Class added successfully!");
    fetchClasses();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleEditClassSuccess = () => {
    setShowEditClassModal(false);
    setEditingClass(null);
    setSuccess("Class updated successfully!");
    fetchClasses();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDeleteClassSuccess = () => {
    setShowDeleteClassModal(false);
    setDeletingClass(null);
    setSuccess("Class deleted successfully!");
    fetchClasses();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleAddShiftSuccess = () => {
    setShowShiftModal(false);
    setSuccess("Shift added successfully!");
    fetchShifts();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleEditShiftSuccess = () => {
    setShowEditShiftModal(false);
    setEditingShift(null);
    setSuccess("Shift updated successfully!");
    fetchShifts();
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleDeleteShiftSuccess = () => {
    setShowDeleteShiftModal(false);
    setDeletingShift(null);
    setSuccess("Shift deleted successfully!");
    fetchShifts();
    setTimeout(() => setSuccess(""), 2000);
  };

  const [showClassModal, setShowClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClass, setDeletingClass] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [showDeleteShiftModal, setShowDeleteShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShift, setDeletingShift] = useState(null);

  return (
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Academic Settings</h1>
      </div>
      {error && <div className="text-red-600 mb-2 font-medium">{error}</div>}
      {success && (
        <div className="text-green-600 mb-2 font-medium">{success}</div>
      )}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SchoolIcon sx={{ mr: 1, color: teal[700], fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Classes for {selectedBranch?.name || "Select Branch"}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Manage classes for the selected branch
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowClassModal(true)}
            disabled={loading || !selectedBranch}
          >
            + Add Class
          </Button>
        </Box>
        <div style={{ maxHeight: "220px", overflow: "auto", marginTop: 24 }}>
          {settingsLoaded && (
            <TableWrapper
              columns={classColumns}
              rows={classesWithSrNo}
              pageSize={5}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            />
          )}
        </div>
      </Paper>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <AccessTimeIcon sx={{ mr: 1, color: teal[700], fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Class Shifts
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Manage shifts that apply to all branches
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowShiftModal(true)}
            disabled={loading}
          >
            + Add Shift
          </Button>
        </Box>
        <div style={{ maxHeight: "220px", overflow: "auto", marginTop: 24 }}>
          {settingsLoaded && (
            <TableWrapper
              columns={shiftColumns}
              rows={shiftsWithSrNo}
              pageSize={5}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            />
          )}
        </div>
      </Paper>
      <AddClassModal
        open={showClassModal}
        onClose={() => setShowClassModal(false)}
        branchId={selectedBranch?.id}
        onSuccess={handleAddClassSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <EditClassModal
        open={showEditClassModal}
        onClose={() => setShowEditClassModal(false)}
        cls={editingClass}
        onSuccess={handleEditClassSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <DeleteClassModal
        open={showDeleteClassModal}
        onClose={() => setShowDeleteClassModal(false)}
        cls={deletingClass}
        onSuccess={handleDeleteClassSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <AddShiftModal
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        onSuccess={handleAddShiftSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <EditShiftModal
        open={showEditShiftModal}
        onClose={() => setShowEditShiftModal(false)}
        shift={editingShift}
        onSuccess={handleEditShiftSuccess}
        setError={setError}
        setLoading={setLoading}
      />
      <DeleteShiftModal
        open={showDeleteShiftModal}
        onClose={() => setShowDeleteShiftModal(false)}
        shift={deletingShift}
        onSuccess={handleDeleteShiftSuccess}
        setError={setError}
        setLoading={setLoading}
      />
    </div>
  );
};

export default AcademicSettings;
