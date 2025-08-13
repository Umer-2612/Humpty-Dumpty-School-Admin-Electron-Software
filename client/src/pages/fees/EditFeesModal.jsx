import React, { useEffect, useState, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import EditIcon from "@mui/icons-material/Edit";
import { teal } from "@mui/material/colors";
import Modal from "../../component/Modal";
import { useBranch } from "../../context/useBranch";
import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import NotesIcon from "@mui/icons-material/Notes";
import QrCodeIcon from "@mui/icons-material/QrCode";

const EditFeesModal = ({
  open,
  onClose,
  onSuccess,
  setError,
  setLoading,
  feesRecord,
}) => {
  const { selected: selectedBranch } = useBranch();
  // Autocomplete/search states (mirrors AddFeesModal)
  const [studentsList, setStudentsList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchTimer = useRef(null);
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    id: null,
    student_id: "",
    amount: "",
    payment_type: "cash",
    cheque_number: "",
    bank_name: "",
    payee_name: "",
    payment_date: new Date().toISOString().split("T")[0],
    academic_year: "",
    month_year: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [students, setStudents] = useState([]);

  // Fetch all students initially (same as AddFeesModal)
  const fetchStudents = useCallback(async (branchId) => {
    if (!window?.electronAPI?.getStudents) return;
    setStudentsLoading(true);
    try {
      const data = await window.electronAPI.getStudents(branchId);
      setStudentsList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching students:", e);
      setStudentsList([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // Search students with debounce (same approach as Add)
  const searchStudents = useCallback(
    async (branchId, query) => {
      if (!query || query.length < 2) {
        await fetchStudents(branchId);
        return;
      }
      setStudentsLoading(true);
      try {
        if (window?.electronAPI?.searchStudents) {
          const data = await window.electronAPI.searchStudents(branchId, query);
          setStudentsList(Array.isArray(data) ? data : []);
        } else {
          const allStudents = await window.electronAPI.getStudents(branchId);
          const arr = Array.isArray(allStudents) ? allStudents : [];
          const lower = query.toLowerCase();
          const filtered = arr.filter((s) => {
            const name = (s.name || "").toLowerCase();
            const roll = (s.roll_number || "").toString().toLowerCase();
            const cls = (s.class_name || "").toLowerCase();
            return (
              name.includes(lower) ||
              roll.includes(lower) ||
              cls.includes(lower)
            );
          });
          setStudentsList(filtered);
        }
      } catch (e) {
        console.error("Error searching students:", e);
        setStudentsList([]);
      } finally {
        setStudentsLoading(false);
      }
    },
    [fetchStudents]
  );

  // Seed initial form from feesRecord
  useEffect(() => {
    if (feesRecord && open) {
      setFormData({
        id: feesRecord.id,
        student_id: feesRecord.student_id,
        amount: String(feesRecord.amount ?? ""),
        payment_type: feesRecord.payment_type || "cash",
        cheque_number: feesRecord.cheque_number || "",
        bank_name: feesRecord.bank_name || "",
        payee_name: feesRecord.payee_name || "",
        payment_date:
          feesRecord.payment_date || new Date().toISOString().split("T")[0],
        academic_year: feesRecord.academic_year || "",
        month_year: feesRecord.month_year || "",
        notes: feesRecord.notes || "",
      });
      setErrors({});
    }
  }, [feesRecord, open]);

  // Fetch students for dropdown (by branch)
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedBranch?.id || !open) return;
      try {
        const result = await window.electronAPI.getStudentsForFees(
          selectedBranch.id
        );
        if (result.success) {
          setStudents(result.students);
        } else {
          setError(result.error || "Failed to fetch students");
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to fetch students");
      }
    };
    fetchStudents();
  }, [selectedBranch?.id, open, setError]);

  // Initialize Autocomplete list from existing students or fetch all
  useEffect(() => {
    if (students && students.length > 0) {
      setStudentsList(students);
    } else if (open) {
      fetchStudents(selectedBranch?.id);
    }
  }, [students, selectedBranch?.id, open, fetchStudents]);

  // Debounced search when dropdown open
  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = setTimeout(() => {
      if (dropdownOpen) {
        searchStudents(selectedBranch?.id, studentSearch);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [studentSearch, dropdownOpen, selectedBranch?.id, searchStudents]);

  // Autocomplete manages selected student via formData.student_id

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.student_id) newErrors.student_id = "Student is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      newErrors.amount = "Valid amount is required";
    if (!formData.payee_name.trim())
      newErrors.payee_name = "Payee name is required";
    if (!formData.payment_date)
      newErrors.payment_date = "Payment date is required";
    if (formData.payment_type === "cheque") {
      if (!formData.cheque_number.trim())
        newErrors.cheque_number = "Cheque number is required";
      if (!formData.bank_name.trim())
        newErrors.bank_name = "Bank name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        branch_id: selectedBranch?.id,
        amount: parseFloat(formData.amount),
        cheque_number:
          formData.payment_type === "cash" ? null : formData.cheque_number,
        bank_name: formData.payment_type === "cash" ? null : formData.bank_name,
      };
      const result = await window.electronAPI.updateFees(payload);
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Failed to update fees record");
      }
    } catch (err) {
      console.error("Error updating fees:", err);
      setError("Failed to update fees record");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!open) return;
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth="sm">
      <Slide in={open} direction="down">
        <Paper
          elevation={6}
          sx={{
            borderRadius: 3,
            minWidth: 340,
            maxWidth: 560,
            mx: "auto",
            bgcolor: "#f8fafc",
            maxHeight: "85vh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
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
            <EditIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Edit Fees
            </Typography>
          </Box>

          <Divider />

          {/* Form Body */}
          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, pt: 2 }}>
            <Grid container spacing={2}>
              {/* Student Selection (Autocomplete) */}
              <Grid item xs={12} sm={7}>
                <Autocomplete
                  fullWidth
                  size="small"
                  open={dropdownOpen}
                  onOpen={() => {
                    setDropdownOpen(true);
                    setStudentSearch("");
                  }}
                  onClose={(event, reason) => {
                    if (reason === "escape") {
                      setDropdownOpen(false);
                      setStudentSearch("");
                    }
                  }}
                  disableCloseOnSelect={false}
                  options={studentsList || []}
                  loading={studentsLoading}
                  value={
                    (studentsList || []).find(
                      (s) => s.id === formData.student_id
                    ) || null
                  }
                  onChange={(e, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      student_id: newValue ? newValue.id : "",
                    }));
                    setDropdownOpen(false);
                    setStudentSearch("");
                    if (errors.student_id)
                      setErrors((prev) => ({ ...prev, student_id: "" }));
                  }}
                  getOptionLabel={(option) =>
                    option
                      ? `${option.name} - ${option.roll_number} (${option.class_name})`
                      : ""
                  }
                  isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      label="Select Student"
                      variant="outlined"
                      error={!!errors?.student_id}
                      helperText={errors?.student_id}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <PersonIcon color="action" fontSize="small" />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                      sx={{ bgcolor: "white" }}
                    />
                  )}
                  PaperComponent={(props) => (
                    <Paper
                      {...props}
                      ref={dropdownRef}
                      sx={{ width: "auto", minWidth: 400, maxWidth: 600 }}
                    >
                      <Box
                        sx={{
                          p: 1,
                          borderBottom: "1px solid #eee",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          bgcolor: "background.paper",
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextField
                          placeholder="Search student..."
                          size="small"
                          fullWidth
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </Box>
                      <Box sx={{ maxHeight: 240, overflow: "auto" }}>
                        {props.children}
                      </Box>
                    </Paper>
                  )}
                  renderOption={(props, option, { index }) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box
                        key={key}
                        component="li"
                        {...otherProps}
                        sx={{ whiteSpace: "nowrap", display: "flex", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {index + 1}.
                        </Typography>
                        <Typography variant="body2">
                          {option.name} - {option.roll_number} (
                          {option.class_name})
                        </Typography>
                      </Box>
                    );
                  }}
                />
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Amount *"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  inputProps={{ min: 0, step: 0.01 }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Inline spacer to mirror Add modal's alignment */}
              <Grid item xs={12} sm={2}>
                <Box sx={{ height: "100%" }}></Box>
              </Grid>

              {/* Payment Type */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    mb: 1,
                    color: teal[600],
                  }}
                >
                  Payment Type
                </Typography>
                <RadioGroup
                  row
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleChange}
                  sx={{
                    columnGap: 3,
                    position: "relative",
                    zIndex: 1,
                    pointerEvents: "auto",
                  }}
                >
                  <FormControlLabel
                    value="cash"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: teal[300],
                          "&.Mui-checked": { color: teal[600] },
                        }}
                      />
                    }
                    label="Cash"
                  />
                  <FormControlLabel
                    value="cheque"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: teal[300],
                          "&.Mui-checked": { color: teal[600] },
                        }}
                      />
                    }
                    label="Cheque"
                  />
                  <FormControlLabel
                    value="upi"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: teal[300],
                          "&.Mui-checked": { color: teal[600] },
                        }}
                      />
                    }
                    label="UPI"
                  />
                </RadioGroup>
              </Grid>

              {/* Payee Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Payee Name"
                  name="payee_name"
                  value={formData.payee_name}
                  onChange={handleChange}
                  error={!!errors.payee_name}
                  helperText={errors.payee_name}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Payment Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Payment Date"
                  name="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  error={!!errors.payment_date}
                  helperText={errors.payment_date}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Cheque Date and Cheque Fields - Conditional (after Payee/Date) */}
              {formData.payment_type === "cheque" && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Cheque Date"
                      name="cheque_date"
                      type="date"
                      value={formData.cheque_date}
                      onChange={handleChange}
                      error={!!errors.cheque_date}
                      helperText={errors.cheque_date}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayIcon
                              color="action"
                              fontSize="small"
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Bank Name"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      error={!!errors.bank_name}
                      helperText={errors.bank_name}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountBalanceIcon
                              color="action"
                              fontSize="small"
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Cheque Number"
                      name="cheque_number"
                      value={formData.cheque_number}
                      onChange={handleChange}
                      error={!!errors.cheque_number}
                      helperText={errors.cheque_number}
                      size="small"
                    />
                  </Grid>
                </>
              )}

              {/* UPI Field - Conditional (after Payee/Date) */}
              {formData.payment_type === "upi" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="UPI ID"
                    name="upi_id"
                    value={formData.upi_id}
                    onChange={handleChange}
                    error={!!errors.upi_id}
                    helperText={errors.upi_id}
                    placeholder="e.g., name@upi"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCodeIcon color="action" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        sx={{ alignSelf: "flex-start", mt: 1 }}
                      >
                        <NotesIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<EditIcon />}
              >
                Update
              </Button>
            </Box>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditFeesModal;
