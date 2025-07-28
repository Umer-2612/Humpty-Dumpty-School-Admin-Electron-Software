import React, { useEffect, useState, useCallback } from "react";
import TableWrapper from "../component/TableWrapper";
import { useBranch } from "../context/useBranch";
import Button from "@mui/material/Button";
import Modal from "../component/Modal";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import NumbersIcon from "@mui/icons-material/Numbers";
import SchoolIcon from "@mui/icons-material/School";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
// Add missing icons for new fields
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
// 1. Import Stack from @mui/material
import Stack from "@mui/material/Stack";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const SETTINGS_KEY = "studentsTableSettings";

const Students = () => {
  const { selected: selectedBranch } = useBranch();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  // 1. Add dropdown options for gender, cities, religions, class divisions
  const genderOptions = [
    { value: "Boy", label: "Boy" },
    { value: "Girl", label: "Girl" },
  ];
  const cityOptions = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Pune",
    "Jaipur",
    "Lucknow",
  ];
  const religionOptions = [
    "Hindu",
    "Muslim",
    "Christian",
    "Sikh",
    "Buddhist",
    "Jain",
    "Other",
  ];
  const classDivOptions = ["A", "B", "C", "D"];

  // 2. Add new fields to form and editForm state
  const [form, setForm] = useState({
    name: "",
    roll_number: "",
    class_id: "",
    parents_contact1: "",
    parents_contact2: "",
    admission_date: "",
    class_last_date: "",
    gender: "",
    mother_name: "",
    father_name: "",
    fee_scholarship: "",
    birth_place: "",
    religion: "",
    class_div: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  // 3. Update handleEditClick to set new fields
  const [editForm, setEditForm] = useState({
    name: "",
    roll_number: "",
    class_id: "",
    parents_contact1: "",
    parents_contact2: "",
    admission_date: "",
    class_last_date: "",
    gender: "",
    mother_name: "",
    father_name: "",
    fee_scholarship: "",
    birth_place: "",
    religion: "",
    class_div: "",
    address: "",
  });

  // 1. Add step state and steps array at the top of Students component:
  const [step, setStep] = useState(0);
  // 1) Change the steps array to only have 2 steps:
  const steps = ["Student Details", "Other Details"];
  // 2) Ensure only 2 steps are used in the wizard logic (step === 0, step === 1).
  // 3) Remove InputAdornment from all TextField labels (icons should not be in the label, only as startAdornment in InputProps for text fields).
  // 4) Ensure no icon overlaps with the label or value in any field.

  // DataGrid columns
  // 4. Update DataGrid columns to show new fields (showing the most important ones)
  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "roll_number",
      headerName: "Roll No.",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "class_name",
      headerName: "Class",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "branch_name",
      headerName: "Branch",
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "parents_contact1",
      headerName: "Parent Contact 1",
      width: 140,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "parents_contact2",
      headerName: "Parent Contact 2",
      width: 140,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "mother_name",
      headerName: "Mother Name",
      width: 140,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "father_name",
      headerName: "Father Name",
      width: 140,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "fee_scholarship",
      headerName: "Fee Scholarship",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "birth_place",
      headerName: "Birth Place",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "religion",
      headerName: "Religion",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "class_div",
      headerName: "Class Div",
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "admission_date",
      headerName: "Admission Date",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "class_last_date",
      headerName: "Class Last Date",
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 160,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
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

  useEffect(() => {
    fetchStudents();
  }, [selectedBranch]);

  useEffect(() => {
    if (selectedBranch?.id) {
      fetchClasses(selectedBranch.id);
    } else {
      setClasses([]);
    }
  }, [selectedBranch]);

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

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.getStudents(selectedBranch?.id);
      setStudents(data);
    } catch (err) {
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async (branch_id) => {
    try {
      const data = await window.electronAPI.getClassesByBranch(branch_id);
      setClasses(data);
    } catch (err) {
      setError("Failed to fetch classes");
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name,
      roll_number: student.roll_number,
      class_id: student.class_id,
      parents_contact1: student.parents_contact1 || "",
      parents_contact2: student.parents_contact2 || "",
      admission_date: student.admission_date || "",
      class_last_date: student.class_last_date || "",
      gender: student.gender || "",
      mother_name: student.mother_name || "",
      father_name: student.father_name || "",
      fee_scholarship: student.fee_scholarship || "",
      birth_place: student.birth_place || "",
      religion: student.religion || "",
      class_div: student.class_div || "",
      address: student.address || "",
    });
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };
  const handleEditInputChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.updateStudent({
        id: editingStudent.id,
        ...editForm,
      });
      if (res.success) {
        setShowEditModal(false);
        setEditingStudent(null);
        setEditForm({
          name: "",
          roll_number: "",
          class_id: "",
          parents_contact1: "",
          parents_contact2: "",
          admission_date: "",
          class_last_date: "",
          gender: "",
          mother_name: "",
          father_name: "",
          fee_scholarship: "",
          birth_place: "",
          religion: "",
          class_div: "",
          address: "",
        });
        setSuccess("Student updated successfully!");
        fetchStudents();
      } else {
        setError(res.error || "Failed to update student");
      }
    } catch (err) {
      setError("Failed to update student");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };
  const handleDeleteClick = (student) => {
    setDeletingStudent(student);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
  };
  const handleDeleteStudent = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.deleteStudent(deletingStudent.id);
      if (res.success) {
        setShowDeleteModal(false);
        setDeletingStudent(null);
        setSuccess("Student deleted successfully!");
        fetchStudents();
      } else {
        setError(res.error || "Failed to delete student");
      }
    } catch (err) {
      setError("Failed to delete student");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await window.electronAPI.addStudent(form);
      if (res.success) {
        setShowModal(false);
        setForm({
          name: "",
          roll_number: "",
          class_id: "",
          parents_contact1: "",
          parents_contact2: "",
          admission_date: "",
          class_last_date: "",
          gender: "",
          mother_name: "",
          father_name: "",
          fee_scholarship: "",
          birth_place: "",
          religion: "",
          class_div: "",
          address: "",
        });
        setSuccess("Student added successfully!");
        fetchStudents();
      } else {
        setError(res.error || "Failed to add student");
      }
    } catch (err) {
      setError("Failed to add student");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Students</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowModal(true)}
          disabled={loading}
        >
          + Add Student
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
            rows={students}
            pageSize={10}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            initialState={{
              sorting: { sortModel: [{ field: "id", sort: "desc" }] },
            }}
          />
        )}
      </div>

      {/* Add Student Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Slide in={showModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              width: "100%",
              maxWidth: { xs: "98vw", sm: 420, md: 520 },
              minWidth: { xs: "90vw", sm: 340 },
              mx: "auto",
              bgcolor: "#f8fafc",
              maxHeight: { xs: "95vh", sm: "80vh", md: "70vh" },
              overflowY: "auto",
              p: { xs: 1, sm: 2 },
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
                Add Student
              </Typography>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-start",
                bgcolor: "#f8fafc",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Step {step + 1} of {steps.length}: {steps[step]}
              </Typography>
            </Box>
            <Box
              component="form"
              id="add-student-form"
              onSubmit={handleAddStudent}
            >
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {step === 0 && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Full Name"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        placeholder="e.g., John Doe"
                        autoFocus
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Roll Number"
                        name="roll_number"
                        value={form.roll_number}
                        onChange={handleInputChange}
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 12345"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        <InputLabel id="add-class-label">Class</InputLabel>
                        <Select
                          labelId="add-class-label"
                          label="Class"
                          name="class_id"
                          value={form.class_id}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="" disabled>
                            <em>Select Class</em>
                          </MenuItem>
                          {classes.map((cls) => (
                            <MenuItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        <InputLabel id="add-class-div-label">
                          Class Division
                        </InputLabel>
                        <Select
                          labelId="add-class-div-label"
                          label="Class Division"
                          name="class_div"
                          value={form.class_div}
                          onChange={handleInputChange}
                          disabled={!form.class_id}
                        >
                          <MenuItem value="" disabled>
                            <em>Select Class Division</em>
                          </MenuItem>
                          {(
                            classes.find((cls) => cls.id === form.class_id)
                              ?.divisions || []
                          ).map((div, idx) => (
                            <MenuItem key={div} value={div}>
                              {div}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        <InputLabel id="add-gender-label">Gender</InputLabel>
                        <Select
                          labelId="add-gender-label"
                          label="Gender"
                          name="gender"
                          value={form.gender}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="" disabled>
                            <em>Select Gender</em>
                          </MenuItem>
                          {genderOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Admission Date"
                          value={form.admission_date}
                          onChange={(newValue) => {
                            setForm({ ...form, admission_date: newValue });
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              size: "small",
                              placeholder: "YYYY-MM-DD",
                              error:
                                !!form.admission_date &&
                                new Date(form.admission_date) > new Date(),
                              helperText:
                                !!form.admission_date &&
                                new Date(form.admission_date) > new Date()
                                  ? "Admission date cannot be in the future"
                                  : "",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                  </>
                )}
                {step === 1 && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="Parent Contact 1"
                        name="parents_contact1"
                        value={form.parents_contact1}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 9876543210"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Parent Contact 2"
                        name="parents_contact2"
                        value={form.parents_contact2}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 0987654321"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Mother Name"
                        name="mother_name"
                        value={form.mother_name}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., Jane Doe"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Father Name"
                        name="father_name"
                        value={form.father_name}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., John Smith"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Fee Scholarship"
                        name="fee_scholarship"
                        value={form.fee_scholarship}
                        onChange={handleInputChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 1000"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Class Last Date"
                          value={form.class_last_date}
                          onChange={(newValue) => {
                            setForm({ ...form, class_last_date: newValue });
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              variant: "outlined",
                              size: "small",
                              placeholder: "YYYY-MM-DD",
                              error:
                                !!form.class_last_date &&
                                new Date(form.class_last_date) > new Date(),
                              helperText:
                                !!form.class_last_date &&
                                new Date(form.class_last_date) > new Date()
                                  ? "Class last date cannot be in the future"
                                  : "",
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl
                        fullWidth
                        required
                        variant="outlined"
                        size="small"
                        sx={{ minWidth: 200 }}
                      >
                        <InputLabel id="add-religion-label">
                          Religion
                        </InputLabel>
                        <Select
                          labelId="add-religion-label"
                          label="Religion"
                          name="religion"
                          value={form.religion}
                          onChange={handleInputChange}
                        >
                          <MenuItem value="" disabled>
                            <em>Select Religion</em>
                          </MenuItem>
                          {religionOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Address"
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        minRows={2}
                        variant="outlined"
                        size="small"
                        placeholder="e.g., 123 Main St, City"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                bgcolor: "#f8fafc",
                p: 1,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                zIndex: 1,
              }}
            >
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              {step > 0 && (
                <Button onClick={() => setStep(step - 1)}>Back</Button>
              )}
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} variant="contained">
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="add-student-form"
                  variant="contained"
                  color="primary"
                >
                  Add Student
                </Button>
              )}
            </Box>
          </Paper>
        </Slide>
      </Modal>

      {/* Edit Student Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)}>
        <Slide in={showEditModal} direction="down">
          <Paper
            elevation={6}
            sx={{
              borderRadius: 3,
              width: "100%",
              maxWidth: { xs: "98vw", sm: 420, md: 520 },
              minWidth: { xs: "90vw", sm: 340 },
              mx: "auto",
              bgcolor: "#f8fafc",
              maxHeight: { xs: "95vh", sm: "80vh", md: "70vh" },
              overflowY: "auto",
              p: { xs: 1, sm: 2 },
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
                Edit Student
              </Typography>
            </Box>
            <Divider />
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "flex-start",
                bgcolor: "#f8fafc",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Step {step + 1} of {steps.length}: {steps[step]}
              </Typography>
            </Box>
            <Box
              component="form"
              id="edit-student-form"
              onSubmit={handleEditStudent}
            >
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
                    placeholder="e.g., John Doe"
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Roll Number"
                    name="roll_number"
                    value={editForm.roll_number}
                    onChange={handleEditInputChange}
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 12345"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <NumbersIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <InputLabel id="edit-class-label">Class</InputLabel>
                    <Select
                      labelId="edit-class-label"
                      label="Class"
                      name="class_id"
                      value={editForm.class_id}
                      onChange={handleEditInputChange}
                    >
                      <MenuItem value="" disabled>
                        <em>Select Class</em>
                      </MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <InputLabel id="edit-class-div-label">Class Div</InputLabel>
                    <Select
                      labelId="edit-class-div-label"
                      label="Class Div"
                      name="class_div"
                      value={editForm.class_div}
                      onChange={handleEditInputChange}
                    >
                      <MenuItem value="" disabled>
                        <em>Select Class Division</em>
                      </MenuItem>
                      {(
                        classes.find((cls) => cls.id === editForm.class_id)
                          ?.divisions || []
                      ).map((div, idx) => (
                        <MenuItem key={div} value={div}>
                          {div}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    required
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 200 }}
                  >
                    <InputLabel id="edit-gender-label">Gender</InputLabel>
                    <Select
                      labelId="edit-gender-label"
                      label="Gender"
                      name="gender"
                      value={editForm.gender}
                      onChange={handleEditInputChange}
                    >
                      <MenuItem value="" disabled>
                        <em>Select Gender</em>
                      </MenuItem>
                      {genderOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Admission Date"
                      value={editForm.admission_date}
                      onChange={(newValue) => {
                        setEditForm({ ...editForm, admission_date: newValue });
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          size: "small",
                          placeholder: "YYYY-MM-DD",
                          error:
                            !!editForm.admission_date &&
                            new Date(editForm.admission_date) > new Date(),
                          helperText:
                            !!editForm.admission_date &&
                            new Date(editForm.admission_date) > new Date()
                              ? "Admission date cannot be in the future"
                              : "",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Parent Contact 1"
                    name="parents_contact1"
                    value={editForm.parents_contact1}
                    onChange={handleEditInputChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 9876543210"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Parent Contact 2"
                    name="parents_contact2"
                    value={editForm.parents_contact2}
                    onChange={handleEditInputChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 0987654321"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Mother Name"
                    name="mother_name"
                    value={editForm.mother_name}
                    onChange={handleEditInputChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g., Jane Doe"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Father Name"
                    name="father_name"
                    value={editForm.father_name}
                    onChange={handleEditInputChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g., John Smith"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Fee Scholarship"
                    name="fee_scholarship"
                    value={editForm.fee_scholarship}
                    onChange={handleEditInputChange}
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 1000"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Class Last Date"
                      value={editForm.class_last_date}
                      onChange={(newValue) => {
                        setEditForm({ ...editForm, class_last_date: newValue });
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: "outlined",
                          size: "small",
                          placeholder: "YYYY-MM-DD",
                          error:
                            !!editForm.class_last_date &&
                            new Date(editForm.class_last_date) > new Date(),
                          helperText:
                            !!editForm.class_last_date &&
                            new Date(editForm.class_last_date) > new Date()
                              ? "Class last date cannot be in the future"
                              : "",
                        },
                      }}
                    />
                  </LocalizationProvider>
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
                onClick={() => setShowEditModal(false)}
                disabled={loading}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-student-form"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Student"}
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
                Delete Student
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this student?
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {deletingStudent?.name}
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
                onClick={handleDeleteStudent}
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

export default Students;
