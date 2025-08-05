import React from "react";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import WcIcon from "@mui/icons-material/Wc";
import HomeIcon from "@mui/icons-material/Home";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

const StudentForm = ({
  form,
  setForm,
  classes,
  shifts,
  step = 0,
  isEditing = false,
  errors = {},
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Step 0: Basic Student Details
  const renderStep0 = () => (
    <>
      <Grid item xs={12}>
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
          type="number"
          error={!!errors.roll_number}
          helperText={errors.roll_number}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon color="action" />
              </InputAdornment>
            ),
            min: 1,
          }}
          sx={{
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            bgcolor: "white",
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl
          fullWidth
          required
          variant="outlined"
          error={!!errors.class_id}
        >
          <InputLabel id="class-label">Class</InputLabel>
          <Select
            labelId="class-label"
            label="Class"
            name="class_id"
            value={form.class_id}
            onChange={handleInputChange}
            sx={{ bgcolor: "white" }}
            startAdornment={
              <InputAdornment position="start">
                <SchoolIcon color="action" />
              </InputAdornment>
            }
          >
            {classes?.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                {cls.name}
              </MenuItem>
            ))}
          </Select>
          {errors.class_id && (
            <div
              style={{
                color: "#d32f2f",
                fontSize: "0.75rem",
                marginTop: "3px",
                marginLeft: "14px",
              }}
            >
              {errors.class_id}
            </div>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl
          fullWidth
          required
          variant="outlined"
          error={!!errors.shift_id}
        >
          <InputLabel id="shift-label">Shift</InputLabel>
          <Select
            labelId="shift-label"
            label="Shift"
            name="shift_id"
            value={form.shift_id}
            onChange={handleInputChange}
            sx={{ bgcolor: "white" }}
            startAdornment={
              <InputAdornment position="start">
                <AccessTimeIcon color="action" />
              </InputAdornment>
            }
          >
            {shifts?.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {`${s.name} (${s.time})`}
              </MenuItem>
            ))}
          </Select>
          {errors.shift_id && (
            <div
              style={{
                color: "#d32f2f",
                fontSize: "0.75rem",
                marginTop: "3px",
                marginLeft: "14px",
              }}
            >
              {errors.shift_id}
            </div>
          )}
        </FormControl>
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

      {/* Row 3: Admission Date | Admission End Date */}
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
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Admission End Date"
          name="admission_end_date"
          value={form.admission_end_date}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          type="date"
          error={!!errors.admission_end_date}
          helperText={errors.admission_end_date}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarTodayIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>

      {/* Row 4: Gender | Religion */}
      <Grid item xs={12} md={5.8}>
        <FormControl
          fullWidth
          variant="outlined"
          error={!!errors.gender}
          size="small"
          sx={{ bgcolor: "white" }}
        >
          <InputLabel id="gender-label">Gender</InputLabel>
          <Select
            labelId="gender-label"
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleInputChange}
            size="small"
            startAdornment={
              <InputAdornment position="start">
                <WcIcon color="action" />
              </InputAdornment>
            }
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
          {errors.gender && (
            <div
              style={{
                color: "#d32f2f",
                fontSize: "0.75rem",
                marginTop: "3px",
                marginLeft: "14px",
              }}
            >
              {errors.gender}
            </div>
          )}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={5.8}>
        <TextField
          label="Religion"
          name="religion"
          value={form.religion}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          error={!!errors.religion}
          helperText={errors.religion}
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
