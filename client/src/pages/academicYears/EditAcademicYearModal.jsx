import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";

const EditAcademicYearModal = ({ open, onClose, academicYear, onSuccess, setError, setLoading }) => {
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (academicYear) {
      setFormData({
        name: academicYear.name || "",
        start_date: academicYear.start_date || "",
        end_date: academicYear.end_date || "",
      });
    }
  }, [academicYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError("Please fill in all fields");
      return;
    }

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: academicYear.id,
        ...formData
      };
      
      const result = await window.electronAPI.updateAcademicYear(payload);
      if (result.success !== false) {
        onSuccess();
      } else {
        setError(result.error || "Failed to update academic year");
      }
    } catch (err) {
      setError("Failed to update academic year");
      console.error("Error updating academic year:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Academic Year</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box className="space-y-4">
            <TextField
              name="name"
              label="Academic Year Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              placeholder="e.g., 2025-2026"
              helperText="Enter a name for this academic year"
            />

            <TextField
              name="start_date"
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              helperText="Academic year start date"
            />

            <TextField
              name="end_date"
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              helperText="Academic year end date"
            />

            {academicYear?.is_active && (
              <Box className="bg-orange-50 p-3 rounded">
                <Typography variant="body2" className="text-orange-800">
                  <strong>Note:</strong> This is the currently active academic year. Changes will affect all modules.
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" className="bg-blue-600 hover:bg-blue-700">
            Update Academic Year
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditAcademicYearModal;
