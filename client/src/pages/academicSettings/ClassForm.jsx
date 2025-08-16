import React from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SchoolIcon from "@mui/icons-material/School";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import NumbersIcon from "@mui/icons-material/Numbers";

const ClassForm = ({ form, setForm, isEditing = false }) => {
  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          label="Class Name"
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
                <SchoolIcon color="action" />
              </InputAdornment>
            ),
          }}
          autoFocus={!isEditing}
          sx={{ bgcolor: "white" }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Term 1 Fee"
          name="term1_fee"
          type="number"
          value={form.term1_fee}
          onChange={handleInputChange}
          fullWidth
          required
          variant="outlined"
          size="small"
          sx={{
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            bgcolor: "white",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CurrencyRupeeIcon color="action" />
              </InputAdornment>
            ),
            min: 0,
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Term 2 Fee"
          name="term2_fee"
          type="number"
          value={form.term2_fee}
          onChange={handleInputChange}
          fullWidth
          required
          variant="outlined"
          size="small"
          sx={{
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            bgcolor: "white",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CurrencyRupeeIcon color="action" />
              </InputAdornment>
            ),
            min: 0,
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="Books Charge"
          name="books_charge"
          type="number"
          value={form.books_charge}
          onChange={handleInputChange}
          fullWidth
          required
          variant="outlined"
          size="small"
          sx={{
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            bgcolor: "white",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CurrencyRupeeIcon color="action" />
              </InputAdornment>
            ),
            min: 0,
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          label="No. of Divisions"
          name="num_divisions"
          type="number"
          value={form.num_divisions}
          onChange={handleInputChange}
          fullWidth
          variant="outlined"
          size="small"
          sx={{
            "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
              WebkitAppearance: "none",
              margin: 0,
            },
            "& input[type=number]": {
              MozAppearance: "textfield",
            },
            bgcolor: "white",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <NumbersIcon color="action" />
              </InputAdornment>
            ),
            min: 0,
          }}
          inputProps={{ min: 0, step: 1 }}
        />
      </Grid>
    </Grid>
  );
};

export default ClassForm;
