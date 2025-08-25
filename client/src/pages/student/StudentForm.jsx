import React, { useEffect } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WcIcon from "@mui/icons-material/Wc";
import HomeIcon from "@mui/icons-material/Home";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PublicIcon from "@mui/icons-material/Public";
import ClassIcon from "@mui/icons-material/Class";

const StudentForm = ({
  form,
  setForm,
  classEntries,
  step = 0,
  isEditing = false,
  errors = {},
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      // If class changes, reset division so user reselects based on the new class
      // With class entries, selecting class_entry sets class_id & shift_id internally
      return { ...prev, [name]: value };
    });
  };

  // Determine selected entry based on current class_id and shift_id (or a stored class_entry_id)
  const selectedEntry = (classEntries || []).find((e) => {
    // Prefer exact match on class_id and shift_id from form
    return (
      String(e.class_id || "") === String(form.class_id || "") &&
      String(e.shift_id || "") === String(form.shift_id || "")
    );
  });

  // Auto-generate next roll number when entry or division changes (only for add mode)
  useEffect(() => {
    const fetchNextRoll = async () => {
      try {
        if (!isEditing && selectedEntry?.id && form.division) {
          const res = await window.electronAPI.getNextRollNumberByEntry(
            selectedEntry.id,
            form.division
          );
          if (res && res.success) {
            setForm((prev) => {
              const current = String(prev.roll_number || "");
              const nextVal = String(res.next);
              if (current === nextVal) return prev; // avoid unnecessary state update
              return { ...prev, roll_number: nextVal };
            });
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchNextRoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntry?.id, form.division, isEditing]);

  // Get divisions count from selected class entry
  const divisionsCount = selectedEntry?.division_count || 0;
  const divisionOptions = Array.from(
    { length: Number(divisionsCount) },
    (_, i) => String.fromCharCode(65 + i)
  );

  // Step 0: Basic Student Details
  const renderStep0 = () => (
    <>
      {/* Row 1: Name (full width) */}
      <Grid item xs={12} md={12}>
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleInputChange}
          fullWidth
          required
          variant="outlined"
          size="small"
          error={!!errors.name}
          helperText={errors.name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
          autoFocus={!isEditing}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      {/* Row 2: Class & Shift | Division (aligned equal widths, no wrap on md+) */}
      <Grid item xs={12}>
        <Grid
          container
          spacing={2}
          sx={{ flexWrap: { xs: "wrap", md: "nowrap" } }}
        >
          <Grid item xs={12} md={6}>
            <TextField
              select
              required
              fullWidth
              variant="outlined"
              size="small"
              label="Class & Shift"
              name="class_entry_id"
              value={selectedEntry?.id || ""}
              onChange={(e) => {
                const entryId = e.target.value;
                const entry = (classEntries || []).find((ce) => String(ce.id) === String(entryId));
                setForm((prev) => ({
                  ...prev,
                  class_id: entry?.class_id || "",
                  shift_id: entry?.shift_id || "",
                  division: "", // reset division when changing entry
                }));
              }}
              error={!!errors.class_id || !!errors.shift_id}
              helperText={errors.class_id || errors.shift_id}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SchoolIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "white",
                "& .MuiInputBase-root": { width: "100%", minHeight: 40 },
              }}
            >
              {(classEntries || []).map((ce) => (
                <MenuItem key={ce.id} value={ce.id}>
                  {`${ce.class_name || ""} - ${ce.shift_name || ""}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* Division (always visible; disabled until class is selected) */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              variant="outlined"
              size="small"
              label="Division"
              name="division"
              value={form.division || ""}
              onChange={handleInputChange}
              error={!!errors.division}
              helperText={
                errors.division ||
                (!selectedEntry?.id ? "Select a class & shift to choose division" : "")
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ClassIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "white",
                "& .MuiInputBase-root": { width: "100%", minHeight: 40 },
              }}
              disabled={!selectedEntry?.id || Number(divisionsCount) === 0}
            >
              {divisionOptions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Grid>
      {/* Row 3: Roll No. (auto-generated) */}
      <Grid item xs={12} md={12}>
        <TextField
          label="Roll No."
          name="roll_number"
          value={form.roll_number}
          onChange={handleInputChange}
          variant="outlined"
          size="small"
          type="number"
          error={!!errors.roll_number}
          helperText={errors.roll_number || "Auto-generated"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
            min: 1,
            readOnly: true,
          }}
          disabled
          sx={{
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
            "& input[type=number]": { MozAppearance: "textfield" },
            // Apply grey only to the input box, not helper text container
            "& .MuiInputBase-root": { bgcolor: "#f5f5f5" },
          }}
          fullWidth
        />
      </Grid>
    </>
  );

  // Step 1: Other Details
  const renderStep1 = () => (
    <>
      {/* Row 1: Father Name | Mother Name */}
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Father Name"
          name="father_name"
          value={form.father_name}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.father_name}
          helperText={errors.father_name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Mother Name"
          name="mother_name"
          value={form.mother_name}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.mother_name}
          helperText={errors.mother_name}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>

      {/* Row 2: Parent Contact 1 | Parent Contact 2 */}
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Parent Contact 1"
          name="parents_contact1"
          value={form.parents_contact1}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.parents_contact1}
          helperText={errors.parents_contact1}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Parent Contact 2"
          name="parents_contact2"
          value={form.parents_contact2}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.parents_contact2}
          helperText={errors.parents_contact2}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PhoneIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>

      {/* Row 3: Admission Date | Gender */}
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Admission Date"
          name="admission_date"
          value={form.admission_date}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          type="date"
          error={!!errors.admission_date}
          helperText={errors.admission_date}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            "& .MuiInputBase-root": { width: "100%" },
          }}
        />
      </Grid>

      <Grid item xs={12} md={5.8}>
        <TextField
          select
          fullWidth
          variant="outlined"
          size="small"
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleInputChange}
          error={!!errors.gender}
          helperText={errors.gender}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <WcIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            "& .MuiInputBase-root": { width: "100%" },
          }}
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
      </Grid>

      {/* Row 4: Religion */}
      <Grid item xs={12} md={5.8}>
        <TextField
          select
          label="Religion"
          name="religion"
          value={form.religion}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.religion}
          helperText={errors.religion}
          sx={{ bgcolor: "white", "& .MuiInputBase-root": { width: "100%" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PublicIcon color="action" />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="Hindu">Hindu</MenuItem>
          <MenuItem value="Muslim">Muslim</MenuItem>
          <MenuItem value="Christian">Christian</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </TextField>
      </Grid>

      {/* Row 5: Birth Place | Fee Scholarship */}
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Birth Place"
          name="birth_place"
          value={form.birth_place}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.birth_place}
          helperText={errors.birth_place}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Fee Scholarship"
          name="fee_scholarship"
          value={form.fee_scholarship}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          type="number"
          error={!!errors.fee_scholarship}
          helperText={errors.fee_scholarship}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountBalanceIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>

      {/* Row 6: Address (Full Width Field) */}
      <Grid item xs={12} sx={{ width: "100%" }}>
        <TextField
          label="Address"
          name="address"
          value={form.address}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          multiline
          rows={3}
          error={!!errors.address}
          helperText={errors.address}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <HomeIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            width: "100%",
          }}
        />
      </Grid>
    </>
  );

  return (
    <Grid container spacing={2}>
      {step === 0 ? renderStep0() : renderStep1()}
    </Grid>
  );
};

export default StudentForm;
