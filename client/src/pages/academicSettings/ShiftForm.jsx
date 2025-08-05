import React from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const ShiftForm = ({ form, setForm, isEditing = false }) => {
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Shift Name"
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
                <AccessTimeIcon color="action" />
              </InputAdornment>
            ),
          }}
          autoFocus={!isEditing}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Time"
          name="time"
          type="time"
          value={form.time}
          onChange={handleInputChange}
          fullWidth
          required
          variant="outlined"
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
    </Grid>
  );
};

export default ShiftForm;
