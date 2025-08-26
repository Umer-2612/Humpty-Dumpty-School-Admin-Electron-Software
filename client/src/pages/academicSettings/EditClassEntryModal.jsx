import React, { useState, useEffect } from "react";
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

const EditClassEntryModal = ({ open, onClose, entry, onSaved, loading: parentLoading = false, setError, setLoading: setParentLoading }) => {
  const [form, setForm] = useState({
    id: null,
    class_name: "",
    shift_name: "Morning",
    start_time: "08:00",
    end_time: "12:00",
    division_count: 0,
    term1_fee: 0,
    term2_fee: 0,
    books_charge: 0,
  });
  const [loading, setLoading] = useState(false);
  const busy = loading || parentLoading;

  useEffect(() => {
    if (entry) {
      setForm({
        id: entry.id,
        class_name: entry.class_name || "",
        shift_name: entry.shift_name || "Morning",
        start_time: entry.start_time || "",
        end_time: entry.end_time || "",
        division_count: Number(entry.division_count) || 0,
        term1_fee: Number(entry.term1_fee) || 0,
        term2_fee: Number(entry.term2_fee) || 0,
        books_charge: Number(entry.books_charge) || 0,
      });
    }
  }, [entry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form?.id) return;
    try {
      setLoading(true);
      setParentLoading && setParentLoading(true);
      const payload = {
        id: form.id,
        class_name: form.class_name?.trim(),
        shift_name: form.shift_name,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        division_count: Number(form.division_count) || 0,
        term1_fee: Number(form.term1_fee) || 0,
        term2_fee: Number(form.term2_fee) || 0,
        books_charge: Number(form.books_charge) || 0,
      };
      const res = await window.electronAPI.updateClassEntry(payload);
      if (res?.success === false) throw new Error(res.error || "Failed to update");
      onSaved && onSaved(res.entry);
    } catch (err) {
      console.error("[EditClassEntryModal] update failed", err);
      setError && setError(err.message || "Failed to update class");
      // allow parent to show a toast; keep local console log for debug
    } finally {
      setLoading(false);
      setParentLoading && setParentLoading(false);
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
              Edit Class
            </Typography>
          </Box>
          <Divider />
          <Box component="form" id="edit-class-form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Class Name"
                  value={form.class_name}
                  onChange={(e) => setForm((p) => ({ ...p, class_name: e.target.value }))}
                  fullWidth
                  required
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
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
                      start_time: p.start_time || (v === "Morning" ? "08:00" : "12:00"),
                      end_time: p.end_time || (v === "Morning" ? "12:00" : "16:00"),
                    }));
                  }}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
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
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  placeholder="HH:MM"
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
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
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Books Charge"
                  type="number"
                  value={form.books_charge}
                  onChange={(e) => setForm((p) => ({ ...p, books_charge: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Term 1 Fee"
                  type="number"
                  value={form.term1_fee}
                  onChange={(e) => setForm((p) => ({ ...p, term1_fee: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Term 2 Fee"
                  type="number"
                  value={form.term2_fee}
                  onChange={(e) => setForm((p) => ({ ...p, term2_fee: e.target.value }))}
                  fullWidth
                  size="small"
                  sx={{ '& .MuiInputBase-root': { height: 40 } }}
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
            <Button onClick={onClose} disabled={busy} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button type="submit" form="edit-class-form" variant="contained" color="primary" disabled={busy}>
              {busy ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Paper>
      </Slide>
    </Modal>
  );
};

export default EditClassEntryModal;
