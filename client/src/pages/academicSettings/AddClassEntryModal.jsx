import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Slide from "@mui/material/Slide";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { teal } from "@mui/material/colors";
import SchoolIcon from "@mui/icons-material/School";
import Modal from "../../component/Modal";

const AddClassEntryModal = ({ open, onClose, branchId, onSuccess, setError, setLoading }) => {
  const [form, setForm] = useState({
    class_name: "",
    shift_name: "Morning",
    start_time: "08:00",
    end_time: "12:00",
    division_count: 4,
    term1_fee: "",
    term2_fee: "",
    books_charge: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) return;
    if (!form.class_name?.trim()) {
      setError && setError("Class name is required");
      return;
    }
    try {
      setLoading && setLoading(true);
      setError && setError("");
      const payload = {
        branch_id: branchId,
        class_name: form.class_name.trim(),
        shift_name: form.shift_name,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        division_count: Number(form.division_count) || 0,
        term1_fee: Number(form.term1_fee) || 0,
        term2_fee: Number(form.term2_fee) || 0,
        books_charge: Number(form.books_charge) || 0,
      };
      const res = await window.electronAPI.addClassEntry(payload);
      if (res?.success === false) throw new Error(res.error || "Failed to add");
      onSuccess && onSuccess(res.entry);
      setForm({
        class_name: "",
        shift_name: "Morning",
        start_time: "08:00",
        end_time: "12:00",
        division_count: 4,
        term1_fee: "",
        term2_fee: "",
        books_charge: "",
      });
    } catch (err) {
      setError && setError(err.message || "Failed to add class");
    } finally {
      setLoading && setLoading(false);
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
            maxWidth: 520,
            mx: "auto",
            bgcolor: "#f8fafc",
            maxHeight: "80vh",
            overflowY: "auto",
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
            <SchoolIcon sx={{ color: "#fff", mr: 1 }} />
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700 }}>
              Add Class
            </Typography>
          </Box>
          <Divider />
          <Box component="form" id="add-class-form" onSubmit={handleSubmit} sx={{ p: 3, pt: 2 }}>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Class Name"
                  value={form.class_name}
                  onChange={(e) => setForm((p) => ({ ...p, class_name: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Shift"
                  value={form.shift_name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((p) => ({
                      ...p,
                      shift_name: v,
                      start_time: v === "Morning" ? "08:00" : "12:00",
                      end_time: v === "Morning" ? "12:00" : "16:00",
                    }));
                  }}
                  fullWidth
                >
                  <MenuItem value="Morning">Morning</MenuItem>
                  <MenuItem value="Afternoon">Afternoon</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  placeholder="HH:MM"
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  placeholder="HH:MM"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Divisions"
                  type="number"
                  value={form.division_count}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      division_count: Number(e.target.value) || 0,
                    }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Books Charge"
                  type="number"
                  value={form.books_charge}
                  onChange={(e) => setForm((p) => ({ ...p, books_charge: e.target.value }))}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Term 1 Fee"
                  type="number"
                  value={form.term1_fee}
                  onChange={(e) => setForm((p) => ({ ...p, term1_fee: e.target.value }))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Term 2 Fee"
                  type="number"
                  value={form.term2_fee}
                  onChange={(e) => setForm((p) => ({ ...p, term2_fee: e.target.value }))}
                  fullWidth
                />
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
            <Button onClick={onClose} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button type="submit" form="add-class-form" variant="contained" color="primary">
              Add Class
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default AddClassEntryModal;
