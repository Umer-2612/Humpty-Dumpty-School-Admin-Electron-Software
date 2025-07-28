import React, { useEffect, useState, useCallback } from "react";
import { useBranch } from "../context/useBranch";
import Button from "@mui/material/Button";
import TableWrapper from "../component/TableWrapper";
import Modal from "../component/Modal";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slide from "@mui/material/Slide";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import { teal } from "@mui/material/colors";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import NumbersIcon from "@mui/icons-material/Numbers";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AddIcon from "@mui/icons-material/Add";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";

const SETTINGS_KEY = "academicSettingsTableSettings";

const AcademicSettings = () => {
  const { selected: selectedBranch, branches } = useBranch();
  const [classes, setClasses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Removed: const [divisions, setDivisions] = useState([]);
  // Removed: const [showDivisionModal, setShowDivisionModal] = useState(false);
  // Removed: const [divisionForm, setDivisionForm] = useState({ name: "" });

  // Classes state
  const [showClassModal, setShowClassModal] = useState(false);
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "",
    total_fees: "",
    divisions: [], // Now array of strings
  });
  const [editClassForm, setEditClassForm] = useState({
    name: "",
    total_fees: "",
    divisions: [], // Now array of strings
  });
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClass, setDeletingClass] = useState(null);

  // Shifts state
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [showDeleteShiftModal, setShowDeleteShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: "", time: "" });
  const [editShiftForm, setEditShiftForm] = useState({ name: "", time: "" });
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShift, setDeletingShift] = useState(null);

  // Table settings
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    let mounted = true;
    if (window.electronAPI && window.electronAPI.getSetting) {
      window.electronAPI.getSetting(SETTINGS_KEY).then((settings) => {
        if (mounted && settings) {
          setColumnVisibilityModel(settings.columnVisibilityModel || {});
        }
        setSettingsLoaded(true);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Save settings on change
  const handleColumnVisibilityModelChange = useCallback((newModel) => {
    setColumnVisibilityModel(newModel);
    if (window.electronAPI && window.electronAPI.setSetting) {
      window.electronAPI.setSetting(SETTINGS_KEY, {
        columnVisibilityModel: newModel,
      });
    }
  }, []);

  const fetchClasses = async () => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.getClassesByBranch) {
        const data = await window.electronAPI.getClassesByBranch(
          selectedBranch.id
        );
        setClasses(data);
      }
    } catch (err) {
      setError("Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.getClassShifts) {
        const data = await window.electronAPI.getClassShifts();
        setShifts(data);
      }
    } catch (err) {
      setError("Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch divisions when branch changes
  useEffect(() => {
    if (selectedBranch?.id) {
      if (window.electronAPI && window.electronAPI.getDivisionsByBranch) {
        window.electronAPI
          .getDivisionsByBranch(selectedBranch.id)
          .then(setDivisions);
      }
    } else {
      setDivisions([]);
    }
  }, [selectedBranch]);

  // Add division handler
  const handleDivisionInputChange = (e) =>
    setDivisionForm({ ...divisionForm, [e.target.name]: e.target.value });
  const handleAddDivision = async (e) => {
    e.preventDefault();
    if (!divisionForm.name.trim()) return;
    if (window.electronAPI && window.electronAPI.addDivision) {
      await window.electronAPI.addDivision({
        branch_id: selectedBranch.id,
        name: divisionForm.name.trim(),
      });
    }
    setDivisionForm({ name: "" });
    setShowDivisionModal(false);
    // Refresh divisions
    if (window.electronAPI && window.electronAPI.getDivisionsByBranch) {
      const updated = await window.electronAPI.getDivisionsByBranch(
        selectedBranch.id
      );
      setDivisions(updated);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [selectedBranch]);

  useEffect(() => {
    fetchShifts();
  }, []);

  // Classes handlers
  const handleClassInputChange = (e) => {
    setClassForm({ ...classForm, [e.target.name]: e.target.value });
  };

  const handleEditClassInputChange = (e) => {
    setEditClassForm({ ...editClassForm, [e.target.name]: e.target.value });
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (window.electronAPI && window.electronAPI.addClass) {
        const res = await window.electronAPI.addClass({
          name: classForm.name,
          branch_id: selectedBranch.id,
          total_fees: Number(classForm.total_fees),
          divisions: classForm.divisions,
        });
        if (res.success) {
          setShowClassModal(false);
          setClassForm({ name: "", total_fees: "", divisions: [] });
          setSuccess("Class added successfully!");
          fetchClasses();
        } else {
          setError(res.error || "Failed to add class");
        }
      }
    } catch (err) {
      setError("Failed to add class");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleEditClassClick = (cls) => {
    setEditingClass(cls);
    setEditClassForm({ name: cls.name, total_fees: cls.total_fees || "" });
    setShowEditClassModal(true);
    setError("");
    setSuccess("");
  };

  const handleEditClass = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (window.electronAPI && window.electronAPI.updateClass) {
        const res = await window.electronAPI.updateClass({
          id: editingClass.id,
          name: editClassForm.name,
          total_fees: Number(editClassForm.total_fees),
          divisions: editingClass.divisions,
        });
        if (res.success) {
          setShowEditClassModal(false);
          setEditingClass(null);
          setEditClassForm({ name: "", total_fees: "" });
          setSuccess("Class updated successfully!");
          fetchClasses();
        } else {
          setError(res.error || "Failed to update class");
        }
      }
    } catch (err) {
      setError("Failed to update class");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleDeleteClassClick = (cls) => {
    setDeletingClass(cls);
    setShowDeleteClassModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClass = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (window.electronAPI && window.electronAPI.deleteClass) {
        const res = await window.electronAPI.deleteClass(deletingClass.id);
        if (res.success) {
          setShowDeleteClassModal(false);
          setDeletingClass(null);
          setSuccess("Class deleted successfully!");
          fetchClasses();
        } else {
          setError(res.error || "Failed to delete class");
        }
      }
    } catch (err) {
      setError("Failed to delete class");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  // Shifts handlers
  const handleShiftInputChange = (e) => {
    setShiftForm({ ...shiftForm, [e.target.name]: e.target.value });
  };

  const handleEditShiftInputChange = (e) => {
    setEditShiftForm({ ...editShiftForm, [e.target.name]: e.target.value });
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (window.electronAPI && window.electronAPI.addClassShift) {
        const res = await window.electronAPI.addClassShift(shiftForm);
        if (res.success) {
          setShowShiftModal(false);
          setShiftForm({ name: "", time: "" });
          setSuccess("Shift added successfully!");
          fetchShifts();
        } else {
          setError(res.error || "Failed to add shift");
        }
      }
    } catch (err) {
      setError("Failed to add shift");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleEditShiftClick = (shift) => {
    setEditingShift(shift);
    setEditShiftForm({ name: shift.name, time: shift.time || "" });
    setShowEditShiftModal(true);
    setError("");
    setSuccess("");
  };

  const handleEditShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (window.electronAPI && window.electronAPI.updateClassShift) {
        const res = await window.electronAPI.updateClassShift({
          id: editingShift.id,
          ...editShiftForm,
        });
        if (res.success) {
          setShowEditShiftModal(false);
          setEditingShift(null);
          setEditShiftForm({ name: "", time: "" });
          setSuccess("Shift updated successfully!");
          fetchShifts();
        } else {
          setError(res.error || "Failed to update shift");
        }
      }
    } catch (err) {
      setError("Failed to update shift");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleDeleteShiftClick = (shift) => {
    setDeletingShift(shift);
    setShowDeleteShiftModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteShift = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (window.electronAPI && window.electronAPI.deleteClassShift) {
        const res = await window.electronAPI.deleteClassShift(deletingShift.id);
        if (res.success) {
          setShowDeleteShiftModal(false);
          setDeletingShift(null);
          setSuccess("Shift deleted successfully!");
          fetchShifts();
        } else {
          setError(res.error || "Failed to delete shift");
        }
      }
    } catch (err) {
      setError("Failed to delete shift");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  // Table columns
  const classColumns = [
    // {
    //   field: "id",
    //   headerName: "ID",
    //   width: 70,
    //   renderCell: (params) => (
    //     <Tooltip title={params.value}>
    //       <span>{params.value}</span>
    //     </Tooltip>
    //   ),
    // },
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
      field: "divisions",
      headerName: "Divisions",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {params.value.map((division, index) => (
            <Chip key={index} label={division} />
          ))}
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

  const shiftColumns = [
    // {
    //   field: "id",
    //   headerName: "ID",
    //   width: 70,
    //   renderCell: (params) => (
    //     <Tooltip title={params.value}>
    //       <span>{params.value}</span>
    //     </Tooltip>
    //   ),
    // },
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

  return (
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Academic Settings</h1>
      </div>

      {error && <div className="text-red-600 mb-2 font-medium">{error}</div>}
      {success && (
        <div className="text-green-600 mb-2 font-medium">{success}</div>
      )}

      {/* Classes Section */}
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
              rows={classes}
              pageSize={5}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            />
          )}
        </div>
      </Paper>

      {/* Shifts Section */}
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
              rows={shifts}
              pageSize={5}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            />
          )}
        </div>
      </Paper>

      {/* Add Class Modal */}
      <Modal open={showClassModal} onClose={() => setShowClassModal(false)}>
        <Slide in={showClassModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              minWidth: 340,
              maxWidth: 520,
              mx: "auto",
              bgcolor: "#f8fafc",
            }}
          >
            <Box
              sx={{
                bgcolor: teal[500],
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                p: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <SchoolIcon sx={{ color: "#fff", mr: 1 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Add Class
              </Typography>
            </Box>
            <Divider />
            <Box
              component="form"
              id="add-class-form"
              onSubmit={handleAddClass}
              sx={{ p: 3, pt: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Class Name"
                    name="name"
                    value={classForm.name}
                    onChange={handleClassInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Total Fees"
                    name="total_fees"
                    type="number"
                    value={classForm.total_fees}
                    onChange={handleClassInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{
                      // Hide spinner for Chrome, Safari, Edge, Opera
                      "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                        {
                          WebkitAppearance: "none",
                          margin: 0,
                        },
                      // Hide spinner for Firefox
                      "& input[type=number]": {
                        MozAppearance: "textfield",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyRupeeIcon color="action" />
                        </InputAdornment>
                      ),
                      min: 0,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={classForm.divisions}
                    onChange={(event, newValue) => {
                      setClassForm({ ...classForm, divisions: newValue });
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Divisions"
                        placeholder="Add divisions (e.g., A, B, C)"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <NumbersIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                bgcolor: "#f8fafc",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <Button
                onClick={() => setShowClassModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-class-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Class"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        open={showEditClassModal}
        onClose={() => setShowEditClassModal(false)}
      >
        <Slide in={showEditClassModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              minWidth: 340,
              maxWidth: 520,
              mx: "auto",
              bgcolor: "#f8fafc",
            }}
          >
            <Box
              sx={{
                bgcolor: teal[500],
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                p: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <SchoolIcon sx={{ color: "#fff", mr: 1 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Edit Class
              </Typography>
            </Box>
            <Divider />
            <Box
              component="form"
              id="edit-class-form"
              onSubmit={handleEditClass}
              sx={{ p: 3, pt: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Class Name"
                    name="name"
                    value={editClassForm.name}
                    onChange={handleEditClassInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SchoolIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Total Fees"
                    name="total_fees"
                    type="number"
                    value={editClassForm.total_fees}
                    onChange={handleEditClassInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    sx={{
                      // Hide spinner for Chrome, Safari, Edge, Opera
                      "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
                        {
                          WebkitAppearance: "none",
                          margin: 0,
                        },
                      // Hide spinner for Firefox
                      "& input[type=number]": {
                        MozAppearance: "textfield",
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CurrencyRupeeIcon color="action" />
                        </InputAdornment>
                      ),
                      min: 0,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={editingClass?.divisions}
                    onChange={(event, newValue) => {
                      setEditingClass({
                        ...editingClass,
                        divisions: newValue,
                      });
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option}
                          {...getTagProps({ index })}
                          key={index}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Divisions"
                        placeholder="Add divisions (e.g., A, B, C)"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <NumbersIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                bgcolor: "#f8fafc",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <Button
                onClick={() => setShowEditClassModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-class-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Class"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Delete Class Modal */}
      <Modal
        open={showDeleteClassModal}
        onClose={() => setShowDeleteClassModal(false)}
      >
        <Slide in={showDeleteClassModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              minWidth: 340,
              maxWidth: 420,
              mx: "auto",
              bgcolor: "#f8fafc",
            }}
          >
            <Box
              sx={{
                bgcolor: teal[500],
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                p: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Delete Class
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this class?
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {deletingClass?.name}
              </Typography>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                bgcolor: "#f8fafc",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <Button
                onClick={() => setShowDeleteClassModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteClass}
                variant="contained"
                color="error"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Add Shift Modal */}
      <Modal open={showShiftModal} onClose={() => setShowShiftModal(false)}>
        <Slide in={showShiftModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              minWidth: 340,
              maxWidth: 520,
              mx: "auto",
              bgcolor: "#f8fafc",
            }}
          >
            <Box
              sx={{
                bgcolor: teal[500],
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                p: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <AccessTimeIcon sx={{ color: "#fff", mr: 1 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Add Shift
              </Typography>
            </Box>
            <Divider />
            <Box
              component="form"
              id="add-shift-form"
              onSubmit={handleAddShift}
              sx={{ p: 3, pt: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Shift Name"
                    name="name"
                    value={shiftForm.name}
                    onChange={handleShiftInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Time"
                    name="time"
                    type="time"
                    value={shiftForm.time}
                    onChange={handleShiftInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                bgcolor: "#f8fafc",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <Button
                onClick={() => setShowShiftModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-shift-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Shift"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Edit Shift Modal */}
      <Modal
        open={showEditShiftModal}
        onClose={() => setShowEditShiftModal(false)}
      >
        <Slide in={showEditShiftModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              minWidth: 340,
              maxWidth: 520,
              mx: "auto",
              bgcolor: "#f8fafc",
            }}
          >
            <Box
              sx={{
                bgcolor: teal[500],
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                p: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <AccessTimeIcon sx={{ color: "#fff", mr: 1 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Edit Shift
              </Typography>
            </Box>
            <Divider />
            <Box
              component="form"
              id="edit-shift-form"
              onSubmit={handleEditShift}
              sx={{ p: 3, pt: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Shift Name"
                    name="name"
                    value={editShiftForm.name}
                    onChange={handleEditShiftInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Time"
                    name="time"
                    type="time"
                    value={editShiftForm.time}
                    onChange={handleEditShiftInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                bgcolor: "#f8fafc",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <Button
                onClick={() => setShowEditShiftModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-shift-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Shift"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Delete Shift Modal */}
      <Modal
        open={showDeleteShiftModal}
        onClose={() => setShowDeleteShiftModal(false)}
      >
        <Slide in={showDeleteShiftModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              minWidth: 340,
              maxWidth: 420,
              mx: "auto",
              bgcolor: "#f8fafc",
            }}
          >
            <Box
              sx={{
                bgcolor: teal[500],
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                p: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Delete Shift
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this shift?
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {deletingShift?.name}
              </Typography>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-end",
                bgcolor: "#f8fafc",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              <Button
                onClick={() => setShowDeleteShiftModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteShift}
                variant="contained"
                color="error"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* REMOVED: Add Division Modal and all references to showDivisionModal and setShowDivisionModal */}
    </div>
  );
};

export default AcademicSettings;
