import React, { useCallback, useEffect } from "react";
import { useBranch } from "../../context/useBranch";
import Modal from "../../component/Modal";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Slide from "@mui/material/Slide";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Autocomplete from "@mui/material/Autocomplete";
import InputAdornment from "@mui/material/InputAdornment";
import { teal } from "@mui/material/colors";
import PaymentIcon from "@mui/icons-material/Payment";
import PersonIcon from "@mui/icons-material/Person";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import NotesIcon from "@mui/icons-material/Notes";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { useYear } from "../../context/YearProvider.jsx";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";

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
  const { selected: selectedYear } = useYear();
  const [studentsList, setStudentsList] = React.useState([]);
  const [studentsLoading, setStudentsLoading] = React.useState(false);
  const [studentSearch, setStudentSearch] = React.useState("");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const searchTimer = React.useRef(null);
  const dropdownRef = React.useRef(null);
  const [termSummary, setTermSummary] = React.useState(null);
  const [feeTerm, setFeeTerm] = React.useState("");
  const [termInfoOpen, setTermInfoOpen] = React.useState(false);

  // Set default payment date to today when modal opens (if empty)
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().slice(0, 10);
      if (!data?.payment_date) {
        setData({ payment_date: today });
      }
    }
  }, [open]);

  // Fetch all students initially
  const fetchStudents = React.useCallback(
    async (branchId) => {
      if (!window?.electronAPI?.getStudents) return;
      setStudentsLoading(true);
      try {
        const data = await window.electronAPI.getStudents(
          branchId,
          selectedYear?.id || null
        );
        setStudentsList(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error fetching students:", e);
        setStudentsList([]);
      } finally {
        setStudentsLoading(false);
      }
    },
    [selectedYear?.id]
  );

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
        if (window?.electronAPI?.searchStudentsByYear) {
          // Use backend search if available
          const data = await window.electronAPI.searchStudentsByYear(
            branchId,
            query,
            selectedYear?.id || null
          );
          setStudentsList(Array.isArray(data) ? data : []);
        } else {
          // Fallback to client-side filtering
          const allStudents = await window.electronAPI.getStudents(
            branchId,
            selectedYear?.id || null
          );
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
    [fetchStudents, selectedYear?.id]
  );

  // Initial load
  React.useEffect(() => {
    if (students && students.length > 0) {
      setStudentsList(students);
    } else {
      fetchStudents(selectedBranch?.id);
    }
  }, [students, selectedBranch?.id, selectedYear?.id, fetchStudents]);

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
  }, [
    studentSearch,
    dropdownOpen,
    selectedBranch?.id,
    selectedYear?.id,
    searchStudents,
  ]);

  // Local fallback state if parent didn't pass setFormData
  const [internalData, setInternalData] = React.useState(formData || {});
  const data = formData ?? internalData;

  // Unified setter that uses parent's setter if available; otherwise local
  const setData = useCallback(
    (patch) => {
      if (typeof setFormData === "function") {
        setFormData((prev) => ({ ...(prev || {}), ...patch }));
      } else {
        setInternalData((prev) => ({ ...(prev || {}), ...patch }));
      }
    },
    [setFormData]
  );

  // Reset all fields after successful submission or when needed
  const resetForm = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cleared = {
      student_id: "",
      amount: "",
      payment_type: "cash",
      bank_name: "",
      cheque_number: "",
      cheque_date: "",
      upi_id: "",
      payee_name: "",
      payment_date: today,
      month_year: "",
      notes: "",
    };
    if (typeof setFormData === "function") {
      setFormData(cleared);
    } else {
      setInternalData(cleared);
    }
    setFeeTerm("");
    setTermSummary(null);
    setTermInfoOpen(false);
    setDropdownOpen(false);
    setStudentSearch("");
  }, [setFormData]);

  // Normalize current type for consistent conditional rendering and value binding
  const paymentType = (data?.payment_type || "cash")
    .toString()
    .trim()
    .toLowerCase();

  // Ensure default payment_type is set once
  React.useEffect(() => {
    if (!data?.payment_type) {
      setData({ payment_type: "cash" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch next receipt number preview when modal opens or payment type changes
  React.useEffect(() => {
    const fetchNextReceipt = async () => {
      try {
        if (!open || !window?.electronAPI?.getNextReceiptNumber) return;
        const normalized = (data?.payment_type || "cash")
          .toString()
          .trim()
          .toLowerCase();
        const res = await window.electronAPI.getNextReceiptNumber(normalized);
        if (res?.success && res?.next) {
          setData({ receipt_preview: res.next });
        } else {
          setData({ receipt_preview: "" });
        }
      } catch (e) {
        console.error("Failed to fetch next receipt number", e);
        setData({ receipt_preview: "" });
      }
    };
    fetchNextReceipt();
  }, [open, data?.payment_type, setData]);

  // Generate academic year months based on selected year's date range
  const generateAcademicYearMonths = React.useMemo(() => {
    if (!selectedYear?.start_date || !selectedYear?.end_date) {
      return [];
    }

    const startDate = new Date(selectedYear.start_date);
    const endDate = new Date(selectedYear.end_date);
    const months = [];
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthName = monthNames[currentDate.getMonth()];
      const year = currentDate.getFullYear().toString().slice(-2); // Get last 2 digits of year
      const monthLabel = `${monthName}-${year}`;
      
      months.push({
        value: monthName, // Keep original month name as value for backend compatibility
        label: monthLabel // Display format like "March-25"
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }, [selectedYear?.start_date, selectedYear?.end_date]);

  // Load student's term summary when a student is selected or year changes
  React.useEffect(() => {
    const loadSummary = async () => {
      try {
        if (!data?.student_id) {
          setTermSummary(null);
          setFeeTerm("");
          return;
        }
        if (!window?.electronAPI?.getStudentTermSummary) return;
        const res = await window.electronAPI.getStudentTermSummary(
          data.student_id,
          selectedYear?.id || null
        );
        if (res?.success) {
          const summary = res.summary || { terms: {} };
          setTermSummary(summary);
          // Auto-pick a default: first term with pending > 0, else first key
          const keys = Object.keys(summary.terms || {});
          if (keys.length) {
            const pendingKey = keys.find(
              (k) => (summary.terms[k]?.pending || 0) > 0
            );
            setFeeTerm(pendingKey || keys[0]);
          } else {
            setFeeTerm("");
          }
        } else {
          setTermSummary(null);
          setFeeTerm("");
        }
      } catch (e) {
        console.error("Failed to load student term summary", e);
        setTermSummary(null);
        setFeeTerm("");
      }
    };
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.student_id, selectedYear?.id]);

  // Format number in Indian numbering system (e.g., 1,00,000.50)
  const formatIndianNumber = (val) => {
    if (val === undefined || val === null) return "";
    const str = val.toString();
    // Keep only digits and at most one decimal point
    const cleaned = str.replace(/[^0-9.]/g, "");
    const [intPartRaw, decPartRaw] = cleaned.split(".");
    if (!intPartRaw) return cleaned; // allow typing leading dot
    // Remove leading zeros except if the number is just 0
    const intDigits = intPartRaw.replace(/^0+(?!$)/, "");
    // Apply Indian grouping to integer part
    let x = intDigits;
    if (x.length <= 3) {
      // No grouping needed for up to 3 digits
    } else {
      const last3 = x.slice(-3);
      const rest = x.slice(0, -3);
      const restGrouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
      x = restGrouped + "," + last3;
    }
    const dec =
      decPartRaw !== undefined ? "." + decPartRaw.replace(/\./g, "") : "";
    return x + dec;
  };

  // Normalize legacy receipt formats for display: c1 -> C-1, b2 -> B-2
  const normalizeReceipt = (raw) => {
    if (!raw) return "";
    const s = String(raw);
    if (/^[cb]\d+$/i.test(s)) {
      return `${s[0].toUpperCase()}-${s.slice(1)}`;
    }
    return s;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      const formatted = formatIndianNumber(value);
      setData({ amount: formatted });
    } else {
      setData({ [name]: value });
    }
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
      if (!data?.month_year) newErrors.month_year = "Upto Month is required";
      const amountNum = parseFloat(
        (data?.amount || "").toString().replace(/,/g, "")
      );
      if (!amountNum || amountNum <= 0)
        newErrors.amount = "Valid amount is required";
      // Payee name is required only for Bank payments
      if (
        paymentType === "bank" &&
        (!data?.payee_name || !data.payee_name.toString().trim())
      )
        newErrors.payee_name = "Payee name is required";

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
          paymentType === "bank" ? data?.cheque_number || null : null,
        bank_name: paymentType === "bank" ? data?.bank_name || null : null,
        payee_name: paymentType === "bank" ? data?.payee_name || "" : null,
        payment_date: data?.payment_date || today,
        cheque_date: paymentType === "bank" ? data?.cheque_date || null : null,
        academic_year_id: selectedYear?.id || null,
        month_year: data?.month_year || null,
        notes: data?.notes || null,
        fee_term: feeTerm || null,
        fee_charge: null,
      };

      console.log({ payload });

      const result = await window.electronAPI.addFees(payload);
      if (result?.success) {
        // Clear form values for next entry
        resetForm();
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
    <>
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
              <Grid container spacing={2} sx={{ flexWrap: "wrap !important" }}>
                {/* Top-right Receipt No (read-only, with label) */}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <TextField
                      label="Receipt No"
                      variant="outlined"
                      size="small"
                      value={normalizeReceipt(data?.receipt_preview || "")}
                      disabled
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <ReceiptLongIcon color="action" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        minWidth: 170,
                        "& .MuiInputBase-root.Mui-disabled": {
                          bgcolor: "#e5e7eb",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#cbd5e1",
                        },
                      }}
                    />
                  </Box>
                </Grid>

                {/* Upto Month Selection */}
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Box sx={{ minWidth: 220 }}>
                      <TextField
                        select
                        fullWidth
                        required
                        label="Upto Month"
                        size="small"
                        value={data?.month_year || ""}
                        onChange={(e) =>
                          setData({ month_year: e.target.value })
                        }
                        error={!!errors?.month_year}
                        helperText={errors?.month_year}
                        sx={{ bgcolor: "white" }}
                      >
                        {generateAcademicYearMonths.length === 0 ? (
                          <MenuItem disabled>
                            Please select an academic year first
                          </MenuItem>
                        ) : (
                          generateAcademicYearMonths.map((month) => (
                            <MenuItem key={month.value} value={month.value}>
                              {month.label}
                            </MenuItem>
                          ))
                        )}
                      </TextField>
                    </Box>
                  </Box>
                </Grid>
                {/* Row 1: Student Selection (own row, field width 50%) */}
                <Grid
                  item
                  xs={12}
                  sx={{
                    flexBasis: "100% !important",
                    maxWidth: "70% !important",
                  }}
                >
                  <Box sx={{ width: "100%" }}>
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
                          ? `${option.name} - (${option.roll_number}) (${option.class_name})`
                          : ""
                      }
                      isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                      renderInput={(params) => {
                        const selected =
                          (studentsList || []).find(
                            (s) => s.id === data?.student_id
                          ) || null;
                        const selectedLabel = selected
                          ? `${selected.name} - (${selected.roll_number}) (${selected.class_name})`
                          : "";
                        return (
                          <Tooltip
                            title={selectedLabel}
                            arrow
                            placement="bottom"
                            disableFocusListener
                            disableTouchListener
                          >
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
                                      <PersonIcon
                                        color="action"
                                        fontSize="small"
                                      />
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                  </>
                                ),
                                endAdornment: (
                                  <>
                                    {params.InputProps.endAdornment}
                                    <IconButton
                                      aria-label="View term details"
                                      size="small"
                                      sx={{ ml: 0.5 }}
                                      disabled={
                                        !data?.student_id ||
                                        !termSummary ||
                                        !Object.keys(termSummary?.terms || {})
                                          .length
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTermInfoOpen(true);
                                      }}
                                    >
                                      <InfoOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                ),
                              }}
                              sx={{
                                bgcolor: "white",
                                "& .MuiInputBase-input": {
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                },
                              }}
                            />
                          </Tooltip>
                        );
                      }}
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
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
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
                            <IconButton
                              aria-label="clear and close"
                              size="small"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Clear selected value and search, then close dropdown
                                setData({ student_id: "" });
                                setStudentSearch("");
                                setDropdownOpen(false);
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
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
                              {`${option.name} - (${option.class_name}) (${option.roll_number})`}
                            </Box>
                          </Box>
                        );
                      }}
                      filterOptions={(x) => x}
                      noOptionsText={
                        studentsLoading ? "Loading..." : "No students found"
                      }
                    />
                  </Box>
                </Grid>

                {/* Row 2: Amount (own row, field width ~30-40%) */}
                <Grid
                  item
                  xs={12}
                  sx={{
                    flexBasis: "100% !important",
                    maxWidth: "100% !important",
                  }}
                >
                  <Box sx={{ width: "30%" }}>
                    <Tooltip
                      title={(data?.amount || "").toString()}
                      arrow
                      placement="bottom"
                      disableFocusListener
                      disableTouchListener
                    >
                      <TextField
                        fullWidth
                        required
                        label="Amount"
                        name="amount"
                        type="text"
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
                          inputProps: { inputMode: "decimal" },
                        }}
                        sx={{
                          bgcolor: "white",
                          "& .MuiInputBase-input": {
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                          "& input[type=number]": {
                            MozAppearance: "textfield",
                          },
                          "& input[type=number]::-webkit-outer-spin-button": {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                          "& input[type=number]::-webkit-inner-spin-button": {
                            WebkitAppearance: "none",
                            margin: 0,
                          },
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
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
                        value="bank"
                        control={
                          <Radio
                            size="small"
                            sx={{
                              color: teal[300],
                              "&.Mui-checked": { color: teal[600] },
                            }}
                          />
                        }
                        label="Bank"
                      />
                    </RadioGroup>
                  </Box>
                </Grid>

                {/* Bank: Payee Name */}
                {paymentType === "bank" && (
                  <Grid item xs={12} sm={6}>
                    <Tooltip
                      title={(data?.payee_name || "").toString()}
                      arrow
                      placement="bottom"
                      disableFocusListener
                      disableTouchListener
                    >
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
                        sx={{
                          bgcolor: "white",
                          "& .MuiInputBase-input": {
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        }}
                      />
                    </Tooltip>
                  </Grid>
                )}

                {/* Payment Date - default to today; shown for both types */}
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

                {/* Bank Fields - Conditional */}
                {paymentType === "bank" && (
                  <>
                    {/* Cheque Date (Bank) */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
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
                              <CalendarTodayIcon
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
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
                              <ReceiptLongIcon
                                color="action"
                                fontSize="small"
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ bgcolor: "white" }}
                      />
                    </Grid>
                  </>
                )}

                {/* UPI Field removed as separate type (merged into Bank) */}

                {/* Notes */}
                <Grid item xs={12}>
                  <Tooltip
                    title={(data?.notes || "").toString()}
                    arrow
                    placement="bottom"
                    disableFocusListener
                    disableTouchListener
                  >
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
                      sx={{
                        bgcolor: "white",
                        "& .MuiInputBase-input": {
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "normal",
                        },
                      }}
                    />
                  </Tooltip>
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
      {/* Term Details Modal */}
      <Modal
        open={termInfoOpen}
        onClose={() => setTermInfoOpen(false)}
        title="Term-wise Fee Details"
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 1 }}>
          {termSummary && Object.keys(termSummary.terms || {}).length > 0 ? (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {Object.entries(termSummary.terms).map(([term, vals]) => (
                <Box
                  key={term}
                  sx={{
                    p: 1.5,
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    minWidth: 200,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {term.toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    Total: ₹{vals.total || 0}
                  </Typography>
                  <Typography variant="body2">
                    Paid: ₹{vals.paid || 0}
                  </Typography>
                  <Typography variant="body2">
                    Pending: ₹{vals.pending || 0}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No term data available.
            </Typography>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default AddFeesModal;
