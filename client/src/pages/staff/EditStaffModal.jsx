import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Slide from "@mui/material/Slide";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import Modal from "../../component/Modal";

const EditStaffModal = ({
  open,
  onClose,
  staff,
  classEntries,
  onSuccess,
  setError,
  setLoading,
}) => {
  const [form, setForm] = useState({
    name: "",
    contact: "",
    staff_type: "",
    assignments: [],
  });
  const [errors, setErrors] = useState({});

  // Initialize form when staff prop changes
  useEffect(() => {
    if (staff && open) {
      setForm({
        name: staff.name || "",
        contact: staff.contact || "",
        staff_type: staff.staff_type || "",
        assignments: Array.isArray(staff.assignments) ? staff.assignments.map(a => ({
          ...a,
          divisions: a.division ? [a.division] : (a.divisions || [])
        })) : [],
      });
      setErrors({});
    }
  }, [staff, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.staff_type) {
      newErrors.staff_type = "Staff type is required";
    }

    if (
      form.staff_type === "teacher" &&
      (!form.assignments || form.assignments.length === 0)
    ) {
      newErrors.assignments =
        "Teachers must have at least one class assignment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Convert divisions arrays to individual assignments like AddStaffModal
      const processedAssignments = [];
      form.assignments.forEach(assignment => {
        if (assignment.class_id) {
          const divisions = assignment.divisions || [];
          if (divisions.length === 0) {
            // No specific divisions - assign to all or none
            processedAssignments.push({
              class_id: assignment.class_id,
              division: ''
            });
          } else {
            // Create separate assignment for each division
            divisions.forEach(division => {
              processedAssignments.push({
                class_id: assignment.class_id,
                division: division
              });
            });
          }
        }
      });
      
      const payload = { 
        ...form, 
        id: staff.id,
        assignments: processedAssignments 
      };
      const res = await window.electronAPI.updateStaff(payload);
      if (res.success) {
        setErrors({});
        onSuccess();
      } else {
        setError(res.error || "Failed to update staff");
      }
    } catch (err) {
      setError("Failed to update staff: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentAdd = () => {
    setForm((prev) => ({
      ...prev,
      assignments: [...prev.assignments, { class_id: "", divisions: [] }],
    }));
  };

  const handleAssignmentRemove = (index) => {
    setForm((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index),
    }));
  };

  const handleAssignmentChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      assignments: prev.assignments.map((assignment, i) => {
        if (i === index) {
          const updated = { ...assignment, [field]: value };
          // Clear divisions when class changes
          if (field === 'class_id') {
            updated.divisions = [];
          }
          return updated;
        }
        return assignment;
      }),
    }));
  };

  const handleStaffTypeChange = (value) => {
    setForm((prev) => ({
      ...prev,
      staff_type: value,
      assignments: value === "teacher" ? prev.assignments : [],
    }));
  };

  if (!staff) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Slide direction="down" in={open} mountOnEnter unmountOnExit>
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
              Edit Staff
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ p: 2, bgcolor: "#f8fafc" }}>

            <form onSubmit={handleUpdateStaff}>
              <Stack spacing={1.5}>
                {/* Basic Information */}
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                  required
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />

                <TextField
                  label="Contact"
                  value={form.contact}
                  onChange={(e) =>
                    setForm({ ...form, contact: e.target.value })
                  }
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />

                <FormControl fullWidth required error={!!errors.staff_type} size="small">
                  <InputLabel>Staff Type</InputLabel>
                  <Select
                    value={form.staff_type}
                    label="Staff Type"
                    onChange={(e) => handleStaffTypeChange(e.target.value)}
                    sx={{ height: 40 }}
                  >
                    <MenuItem value="office">Office Staff</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
                  </Select>
                  {errors.staff_type && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.5 }}
                    >
                      {errors.staff_type}
                    </Typography>
                  )}
                </FormControl>


                {/* Teacher Assignments */}
                {form.staff_type === "teacher" && (
                  <Box sx={{ mt: 1 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: teal[700] }}>
                        Class Assignments
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleAssignmentAdd}
                        sx={{ minHeight: 32, fontSize: '0.75rem' }}
                      >
                        + Add Class
                      </Button>
                    </Stack>

                    {form.assignments.map((assignment, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          bgcolor: "#fafafa",
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                          <FormControl sx={{ minWidth: 160, flex: 1 }} size="small">
                            <InputLabel>Class</InputLabel>
                            <Select
                              value={assignment.class_id}
                              label="Class"
                              onChange={(e) =>
                                handleAssignmentChange(
                                  index,
                                  "class_id",
                                  e.target.value
                                )
                              }
                              sx={{ height: 36 }}
                            >
                              {(classEntries || []).map((entry) => (
                                <MenuItem key={entry.id} value={entry.id}>
                                  {entry.class_name}
                                  {entry.shift_name
                                    ? ` - ${entry.shift_name}`
                                    : ""}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {(() => {
                            const selectedClass = (classEntries || []).find(
                              entry => String(entry.id) === String(assignment.class_id)
                            );
                            const numDivisions = selectedClass?.division_count || selectedClass?.num_divisions || 0;
                            
                            if (numDivisions > 0) {
                              const divisionOptions = Array.from({ length: numDivisions }, (_, i) => 
                                String.fromCharCode(65 + i) // A, B, C, etc.
                              );
                              
                              return (
                                <FormControl sx={{ minWidth: 120, flex: 0.6 }} size="small">
                                  <InputLabel>Divisions</InputLabel>
                                  <Select
                                    multiple
                                    value={assignment.divisions || []}
                                    label="Divisions"
                                    onChange={(e) =>
                                      handleAssignmentChange(
                                        index,
                                        "divisions",
                                        e.target.value
                                      )
                                    }
                                    sx={{ height: 36 }}
                                    renderValue={(selected) => {
                                      if (!selected || selected.length === 0) {
                                        return <em>Select divisions</em>;
                                      }
                                      if (selected.length <= 2) {
                                        return (
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                              <Chip key={value} label={value} size="small" />
                                            ))}
                                          </Box>
                                        );
                                      } else {
                                        const visible = selected.slice(0, 2);
                                        const remaining = selected.length - 2;
                                        return (
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                                            {visible.map((value) => (
                                              <Chip key={value} label={value} size="small" />
                                            ))}
                                            <Chip 
                                              label={`+${remaining}`} 
                                              size="small" 
                                              variant="outlined"
                                              sx={{ color: 'text.secondary' }}
                                            />
                                          </Box>
                                        );
                                      }
                                    }}
                                  >
                                    {divisionOptions.map((div) => (
                                      <MenuItem key={div} value={div}>
                                        <Checkbox checked={(assignment.divisions || []).includes(div)} />
                                        <ListItemText primary={div} />
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              );
                            } else {
                              return (
                                <TextField
                                  label="Division"
                                  value={(assignment.divisions || []).join(', ')}
                                  onChange={(e) => {
                                    const divisions = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                                    handleAssignmentChange(index, "divisions", divisions);
                                  }}
                                  placeholder="A, B, C..."
                                  size="small"
                                  sx={{ 
                                    minWidth: 120, 
                                    flex: 0.6,
                                    '& .MuiInputBase-root': { height: 36 }
                                  }}
                                />
                              );
                            }
                          })()}

                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleAssignmentRemove(index)}
                            sx={{ minHeight: 36, minWidth: 70, fontSize: '0.75rem' }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Box>
                    ))}

                    {errors.assignments && (
                      <Typography variant="caption" color="error">
                        {errors.assignments}
                      </Typography>
                    )}
                  </Box>
                )}

              </Stack>
            </form>
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
            }}
          >
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleUpdateStaff}
              variant="contained"
              color="primary"
            >
              Update Staff
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditStaffModal;
