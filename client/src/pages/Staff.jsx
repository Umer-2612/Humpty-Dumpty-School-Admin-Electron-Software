import React, { useEffect, useState, useCallback } from "react";
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
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import InputAdornment from "@mui/material/InputAdornment";
import { teal } from "@mui/material/colors";
import SchoolIcon from "@mui/icons-material/School";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";

const SETTINGS_KEY = "staffTableSettings";

const Staff = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact: "",
    classIds: [],
    shiftIds: [],
  });
  const [editForm, setEditForm] = useState({
    name: "",
    contact: "",
    classIds: [],
    shiftIds: [],
  });
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deletingTeacher, setDeletingTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getTeachers();
      setTeachers(data);
    } catch (err) {
      setError("Failed to fetch teachers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
    // Fetch classes for dropdown
    window.electronAPI.getClasses().then(setClasses);
    window.electronAPI.getClassShifts().then(setShifts);
  }, []);

  // Load settings on mount
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

  // Save settings on change
  const handleColumnVisibilityModelChange = useCallback((newModel) => {
    setColumnVisibilityModel(newModel);
    window.electronAPI.setSetting(SETTINGS_KEY, {
      columnVisibilityModel: newModel,
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleMultiSelectChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleEditMultiSelectChange = (name) => (e) => {
    setEditForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.addTeacher({
        name: form.name,
        contact: form.contact,
        classIds: form.classIds,
        shiftIds: form.shiftIds,
      });
      if (res.success) {
        setShowModal(false);
        setForm({ name: "", contact: "", classIds: [], shiftIds: [] });
        setSuccess("Teacher added successfully!");
        fetchTeachers();
      } else {
        setError(res.error || "Failed to add teacher");
      }
    } catch (err) {
      setError("Failed to add teacher");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleEditClick = (teacher) => {
    setEditingTeacher(teacher);
    // Extract all classIds and shiftIds for this teacher
    const teacherAssignments = teachers.filter((t) => t.id === teacher.id);
    setEditForm({
      name: teacher.name,
      contact: teacher.contact,
      classIds: teacherAssignments.map((t) => t.class_id).filter(Boolean),
      shiftIds: teacherAssignments.map((t) => t.shift_id).filter(Boolean),
    });
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };
  const handleEditTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.updateTeacher({
        id: editingTeacher.id,
        name: editForm.name,
        contact: editForm.contact,
        classIds: editForm.classIds,
        shiftIds: editForm.shiftIds,
      });
      if (res.success) {
        setShowEditModal(false);
        setEditingTeacher(null);
        setEditForm({ name: "", contact: "", classIds: [], shiftIds: [] });
        setSuccess("Teacher updated successfully!");
        fetchTeachers();
      } else {
        setError(res.error || "Failed to update teacher");
      }
    } catch (err) {
      setError("Failed to update teacher");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };
  const handleDeleteClick = (teacher) => {
    setDeletingTeacher(teacher);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
  };
  const handleDeleteTeacher = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.deleteTeacher(deletingTeacher.id);
      if (res.success) {
        setShowDeleteModal(false);
        setDeletingTeacher(null);
        setSuccess("Teacher deleted successfully!");
        fetchTeachers();
      } else {
        setError(res.error || "Failed to delete teacher");
      }
    } catch (err) {
      setError("Failed to delete teacher");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const columns = [
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
          <span>
            {Array.isArray(params.row.class_names)
              ? params.row.class_names.join(", ")
              : "-"}
          </span>
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
          <span>
            {Array.isArray(params.row.shift_names)
              ? params.row.shift_names.join(", ")
              : "-"}
          </span>
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

  return (
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Staff</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          + Add Teacher
        </Button>
      </div>
      {error && <div className="text-red-600 mb-2 font-medium">{error}</div>}
      {success && (
        <div className="text-green-600 mb-2 font-medium">{success}</div>
      )}
      <div style={{ width: "100%", height: "70vh" }}>
        {settingsLoaded && (
          <TableWrapper
            columns={columns}
            rows={teachers}
            pageSize={10}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            initialState={{
              sorting: { sortModel: [{ field: "id", sort: "desc" }] },
            }}
          />
        )}
      </div>

      {/* Add Teacher Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Slide in={showModal} direction="down">
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
              <PersonIcon sx={{ color: "#fff", mr: 1 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Add Teacher
              </Typography>
            </Box>
            <Divider />
            <Box
              component="form"
              id="add-teacher-form"
              onSubmit={handleAddTeacher}
              sx={{ p: 3, pt: 2 }}
            >
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ minWidth: 220 }}
                  >
                    <InputLabel id="class-label">Class</InputLabel>
                    <Select
                      labelId="class-label"
                      label="Class"
                      name="classIds"
                      multiple
                      value={form.classIds}
                      onChange={handleMultiSelectChange("classIds")}
                      sx={{ minHeight: 56 }}
                      renderValue={(selected) =>
                        selected.length === 0 ? (
                          <span style={{ color: "#aaa" }}>
                            Select class(es)...
                          </span>
                        ) : (
                          classes
                            .filter((cls) => selected.includes(cls.id))
                            .map((cls) => cls.class_name)
                            .join(", ")
                        )
                      }
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          <Checkbox
                            checked={form.classIds.indexOf(cls.id) > -1}
                          />
                          <ListItemText primary={cls.class_name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ minWidth: 220 }}
                  >
                    <InputLabel id="shift-label">Shift</InputLabel>
                    <Select
                      labelId="shift-label"
                      label="Shift"
                      name="shiftIds"
                      multiple
                      value={form.shiftIds}
                      onChange={handleMultiSelectChange("shiftIds")}
                      sx={{ minHeight: 56 }}
                      renderValue={(selected) =>
                        selected.length === 0 ? (
                          <span style={{ color: "#aaa" }}>
                            Select shift(s)...
                          </span>
                        ) : (
                          shifts
                            .filter((s) => selected.includes(s.id))
                            .map((s) => `${s.name} (${s.time})`)
                            .join(", ")
                        )
                      }
                    >
                      {shifts.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          <Checkbox
                            checked={form.shiftIds.indexOf(s.id) > -1}
                          />
                          <ListItemText primary={`${s.name} (${s.time})`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {(error || success) && (
                  <Grid item xs={12}>
                    {error && (
                      <Typography color="error" fontWeight={500}>
                        {error}
                      </Typography>
                    )}
                    {success && (
                      <Typography color="success.main" fontWeight={500}>
                        {success}
                      </Typography>
                    )}
                  </Grid>
                )}
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
                onClick={() => setShowModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="add-teacher-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Teacher"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <Slide in={showEditModal} direction="down">
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
              <PersonIcon sx={{ color: "#fff", mr: 1 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
                Edit Teacher
              </Typography>
            </Box>
            <Divider />
            <Box
              component="form"
              id="edit-teacher-form"
              onSubmit={handleEditTeacher}
              sx={{ p: 3, pt: 2 }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Contact"
                    name="contact"
                    value={editForm.contact}
                    onChange={handleEditInputChange}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ minWidth: 220 }}
                  >
                    <InputLabel id="edit-class-label">Class</InputLabel>
                    <Select
                      labelId="edit-class-label"
                      label="Class"
                      name="classIds"
                      multiple
                      value={editForm.classIds}
                      onChange={handleEditMultiSelectChange("classIds")}
                      sx={{ minHeight: 56 }}
                      renderValue={(selected) =>
                        selected.length === 0 ? (
                          <span style={{ color: "#aaa" }}>
                            Select class(es)...
                          </span>
                        ) : (
                          classes
                            .filter((cls) => selected.includes(cls.id))
                            .map((cls) => cls.class_name)
                            .join(", ")
                        )
                      }
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          <Checkbox
                            checked={editForm.classIds.indexOf(cls.id) > -1}
                          />
                          <ListItemText primary={cls.class_name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    sx={{ minWidth: 220 }}
                  >
                    <InputLabel id="edit-shift-label">Shift</InputLabel>
                    <Select
                      labelId="edit-shift-label"
                      label="Shift"
                      name="shiftIds"
                      multiple
                      value={editForm.shiftIds}
                      onChange={handleEditMultiSelectChange("shiftIds")}
                      sx={{ minHeight: 56 }}
                      renderValue={(selected) =>
                        selected.length === 0 ? (
                          <span style={{ color: "#aaa" }}>
                            Select shift(s)...
                          </span>
                        ) : (
                          shifts
                            .filter((s) => selected.includes(s.id))
                            .map((s) => `${s.name} (${s.time})`)
                            .join(", ")
                        )
                      }
                    >
                      {shifts.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          <Checkbox
                            checked={editForm.shiftIds.indexOf(s.id) > -1}
                          />
                          <ListItemText primary={`${s.name} (${s.time})`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {(error || success) && (
                  <Grid item xs={12}>
                    {error && (
                      <Typography color="error" fontWeight={500}>
                        {error}
                      </Typography>
                    )}
                    {success && (
                      <Typography color="success.main" fontWeight={500}>
                        {success}
                      </Typography>
                    )}
                  </Grid>
                )}
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
                onClick={() => setShowEditModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-teacher-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Teacher"}
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Slide in={showDeleteModal} direction="down">
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
                Delete Teacher
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this teacher?
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {deletingTeacher?.name}
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
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTeacher}
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
    </div>
  );
};

export default Staff;
