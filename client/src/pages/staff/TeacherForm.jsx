import React from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/Person";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const TeacherForm = ({ form, setForm, classes, shifts, isEditing = false }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
  };

  return (
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
          size="small"
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
          label="Contact"
          name="contact"
          value={form.contact}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
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
      <Grid item xs={12}>
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
            sx={{ minHeight: 56, bgcolor: "white" }}
            renderValue={(selected) =>
              selected.length === 0 ? (
                <span style={{ color: "#aaa" }}>Select class(es)...</span>
              ) : (
                classes
                  .filter((cls) => selected.includes(cls.id))
                  .map((cls) => cls.class_name)
                  .join(", ")
              )
            }
            startAdornment={
              <InputAdornment position="start">
                <SchoolIcon color="action" />
              </InputAdornment>
            }
          >
            {classes.map((cls) => (
              <MenuItem key={cls.id} value={cls.id}>
                <Checkbox checked={form.classIds.indexOf(cls.id) > -1} />
                <ListItemText primary={cls.class_name} />
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
            sx={{ minHeight: 56, bgcolor: "white" }}
            renderValue={(selected) =>
              selected.length === 0 ? (
                <span style={{ color: "#aaa" }}>Select shift(s)...</span>
              ) : (
                shifts
                  .filter((s) => selected.includes(s.id))
                  .map((s) => `${s.name} (${s.time})`)
                  .join(", ")
              )
            }
            startAdornment={
              <InputAdornment position="start">
                <AccessTimeIcon color="action" />
              </InputAdornment>
            }
          >
            {shifts.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                <Checkbox checked={form.shiftIds.indexOf(s.id) > -1} />
                <ListItemText primary={`${s.name} (${s.time})`} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default TeacherForm;
