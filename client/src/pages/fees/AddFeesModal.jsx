import React from "react";
import { useBranch } from "../../context/useBranch";
import Modal from "../../component/Modal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import { teal } from "@mui/material/colors";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import NotesIcon from "@mui/icons-material/Notes";
import QrCodeIcon from "@mui/icons-material/QrCode";

const AddFeesModal = ({
  open,
  onClose,
  handleSubmit,
  formData,
  setFormData,
  students,
  errors,
  localLoading,
  onSuccess,
  setError,
  setLoading,
}) => {
  const { selected: selectedBranch } = useBranch?.() || {};
  const [studentsList, setStudentsList] = React.useState([]);
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const searchTimer = React.useRef(null);
  const dropdownRef = React.useRef(null);

  // Fetch all students initially
  const fetchStudents = React.useCallback(async (branchId) => {
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

  // Search students with debounce
  const searchStudents = React.useCallback(
    async (branchId, query) => {
      if (!query || query.length < 2) {
        // If query is empty or too short, fetch all students
        await fetchStudents(branchId);
        return;
      }

      setStudentsLoading(true);
      try {
        if (window?.electronAPI?.searchStudents) {
          // Use backend search if available
          const data = await window.electronAPI.searchStudents(branchId, query);
          setStudentsList(Array.isArray(data) ? data : []);
        } else {
          // Fallback to client-side filtering
          const allStudents = await window.electronAPI.getStudents(branchId);
          const students = Array.isArray(allStudents) ? allStudents : [];
          const lower = query.toLowerCase();
          const filtered = students.filter((s) => {
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

  // Initial load
  React.useEffect(() => {
    if (students && students.length > 0) {
      setStudentsList(students);
    } else {
      fetchStudents(selectedBranch?.id);
    }
  }, [students, selectedBranch?.id, fetchStudents]);

  // Debounced search effect
  React.useEffect(() => {
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

  // Local fallback state if parent didn't pass setFormData
  const [internalData, setInternalData] = React.useState(formData || {});
  const data = formData ?? internalData;

  // Unified setter that uses parent's setter if available; otherwise local
  const setData = (patch) => {
    if (typeof setFormData === "function") {
      setFormData((prev) => ({ ...(prev || {}), ...patch }));
    } else {
      setInternalData((prev) => ({ ...(prev || {}), ...patch }));
    }
  };

  // Ensure default payment_type is set once
  React.useEffect(() => {
    if (!data?.payment_type) {
      setData({ payment_type: "cash" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData({ [name]: value });
  };

  // RadioGroup onChange provides (event, value). event.target.name is undefined,
  // so handle it explicitly to ensure payment_type updates correctly.
  const handlePaymentTypeChange = (event, value) => {
    const raw = value ?? event?.target?.value;
    const normalized = (raw || "cash").toString().trim().toLowerCase();
    // When switching, clear irrelevant fields to avoid stale values and errors
    const resets =
      normalized === "cheque"
        ? { upi_id: "" }
        : normalized === "upi"
        ? { bank_name: "", cheque_number: "", cheque_date: "" }
        : { bank_name: "", cheque_number: "", cheque_date: "", upi_id: "" };
    setData({ payment_type: normalized, ...resets });
  };

  // Normalize current type for consistent conditional rendering and value binding
  const paymentType = (data?.payment_type || "cash")
    .toString()
    .trim()
    .toLowerCase();

  // Internal submit handler (uses external handleSubmit if provided)
  const onSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();

    if (typeof handleSubmit === "function") {
      // Allow parent override if explicitly passed
      return handleSubmit(e);
    }

    try {
      // Basic validation
      const newErrors = {};
      if (!data?.student_id) newErrors.student_id = "Student is required";
      const amountNum = parseFloat(data?.amount);
      if (!amountNum || amountNum <= 0)
        newErrors.amount = "Valid amount is required";
      if (!data?.payee_name || !data.payee_name.toString().trim())
        newErrors.payee_name = "Payee name is required";
      if (paymentType === "cheque") {
        if (!data?.bank_name || !data.bank_name.toString().trim())
          newErrors.bank_name = "Bank name is required";
        if (!data?.cheque_number || !data.cheque_number.toString().trim())
          newErrors.cheque_number = "Cheque number is required";
      }

      // Surface first validation error via setError, if provided
      if (Object.keys(newErrors).length > 0) {
        if (typeof setError === "function") {
          const firstKey = Object.keys(newErrors)[0];
          setError(newErrors[firstKey]);
        }
        return;
      }

      if (typeof setLoading === "function") setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const payload = {
        student_id: data?.student_id,
        branch_id: selectedBranch?.id,
        amount: amountNum,
        payment_type: paymentType,
        cheque_number:
          paymentType === "cheque" ? data?.cheque_number || null : null,
        bank_name: paymentType === "cheque" ? data?.bank_name || null : null,
        payee_name: data?.payee_name || "",
        payment_date: data?.payment_date || today,
        academic_year: data?.academic_year || null,
        month_year: data?.month_year || null,
        notes: data?.notes || null,
      };

      const result = await window.electronAPI.addFees(payload);
      if (result?.success) {
        if (typeof onSuccess === "function") onSuccess();
      } else {
        if (typeof setError === "function")
          setError(result?.error || "Failed to collect fees");
      }
    } catch (err) {
      console.error("Error collecting fees:", err);
      if (typeof setError === "function") setError("Failed to collect fees");
    } finally {
      if (typeof setLoading === "function") setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
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
            <PaymentIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Collect Fees
            </Typography>
          </Box>

          <Divider />

          {/* Form Body */}
          <Box
            component="form"
            id="add-fees-form"
            onSubmit={onSubmit}
            sx={{ p: 3, pt: 2 }}
          >
            <Grid container spacing={2}>
              {/* Student Selection, Amount, and inline Payment Details label */}
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
                    // Only close on explicit escape; ignore blur/backdrop while using internal search
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
                      (s) => s.id === data?.student_id
                    ) || null
                  }
                  onChange={(e, newValue) => {
                    setData({ student_id: newValue ? newValue.id : "" });
                    setDropdownOpen(false);
                    setStudentSearch("");
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
                      sx={{
                        width: "auto",
                        minWidth: 400,
                        maxWidth: 600,
                      }}
                    >
                      {/* Search header */}
                      <Box
                        sx={{
                          p: 1,
                          borderBottom: "1px solid #eee",
                          position: "sticky",
                          top: 0,
                          zIndex: 1,
                          bgcolor: "background.paper",
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <TextField
                          placeholder="Search student..."
                          size="small"
                          fullWidth
                          value={studentSearch}
                          onChange={(e) => {
                            setStudentSearch(e.target.value);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          autoFocus
                        />
                      </Box>
                      {/* Options list */}
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
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          padding: "8px 16px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Box
                          component="span"
                          sx={{
                            minWidth: "24px",
                            marginRight: "8px",
                            fontFamily: "inherit",
                            fontSize: "inherit",
                            fontWeight: "inherit",
                            color: "inherit",
                          }}
                        >
                          {index + 1}.
                        </Box>
                        <Box component="span" sx={{ flex: 1 }}>
                          {`${option.name} - ${option.roll_number} (${option.class_name})`}
                        </Box>
                      </Box>
                    );
                  }}
                  filterOptions={(x) => x}
                  noOptionsText={
                    studentsLoading ? "Loading..." : "No students found"
                  }
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  required
                  label="Amount"
                  name="amount"
                  type="number"
                  variant="outlined"
                  size="small"
                  value={data?.amount || ""}
                  onChange={handleChange}
                  error={!!errors?.amount}
                  helperText={errors?.amount}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                    inputProps: { min: 0, step: 0.01 },
                  }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              {/* Inline Payment Details label on the first row (right aligned) */}
              <Grid item xs={12} sm={2}>
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: { xs: "flex-start", sm: "flex-end" },
                  }}
                ></Box>
              </Grid>

              <Grid item xs={12}>
                <Box>
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
                    value={paymentType}
                    onChange={handlePaymentTypeChange}
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
                </Box>
              </Grid>

              {/* Payee Name - Common for all payment types */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Payee Name"
                  name="payee_name"
                  variant="outlined"
                  size="small"
                  value={data?.payee_name || ""}
                  onChange={handleChange}
                  error={!!errors?.payee_name}
                  helperText={errors?.payee_name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              {/* Payment Date - to match Edit modal */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Payment Date"
                  name="payment_date"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={data?.payment_date || ""}
                  onChange={handleChange}
                  error={!!errors?.payment_date}
                  helperText={errors?.payment_date}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              {/* Cheque Date (only for cheque) */}
              {paymentType === "cheque" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Cheque Date"
                    name="cheque_date"
                    type="date"
                    variant="outlined"
                    size="small"
                    value={data?.cheque_date || ""}
                    onChange={handleChange}
                    error={!!errors?.cheque_date}
                    helperText={errors?.cheque_date}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon color="action" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>
              )}

              {/* Cheque Fields - Conditional */}
              {paymentType === "cheque" && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Bank Name"
                      name="bank_name"
                      variant="outlined"
                      size="small"
                      value={data?.bank_name || ""}
                      onChange={handleChange}
                      error={!!errors?.bank_name}
                      helperText={errors?.bank_name}
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
                      sx={{ bgcolor: "white" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Cheque Number"
                      name="cheque_number"
                      variant="outlined"
                      size="small"
                      value={data?.cheque_number || ""}
                      onChange={handleChange}
                      error={!!errors?.cheque_number}
                      helperText={errors?.cheque_number}
                      sx={{ bgcolor: "white" }}
                    />
                  </Grid>
                </>
              )}

              {/* UPI Field - Conditional */}
              {paymentType === "upi" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="UPI ID"
                    name="upi_id"
                    variant="outlined"
                    size="small"
                    value={data?.upi_id || ""}
                    onChange={handleChange}
                    error={!!errors?.upi_id}
                    helperText={errors?.upi_id}
                    placeholder="e.g., name@upi"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <QrCodeIcon color="action" fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>
              )}

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={2}
                  variant="outlined"
                  size="small"
                  value={data?.notes || ""}
                  onChange={handleChange}
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
                  sx={{ bgcolor: "white" }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Footer */}
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
            <Button onClick={onClose} disabled={localLoading} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-fees-form"
              variant="contained"
              color="primary"
              disabled={localLoading}
            >
              {localLoading ? "Collecting..." : "Collect Fees"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default AddFeesModal;
