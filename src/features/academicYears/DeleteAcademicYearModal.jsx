'use client';
import api from "@/lib/api";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

const DeleteAcademicYearModal = ({ open, onClose, academicYear, onSuccess, setError, setLoading }) => {
  const handleDelete = async () => {
    if (!academicYear) return;

    setLoading(true);
    try {
      const result = await api.deleteAcademicYear(academicYear.id);
      if (result.success !== false) {
        onSuccess();
      } else {
        setError(result.error || "Failed to delete academic year");
      }
    } catch (err) {
      setError("Failed to delete academic year");
      console.error("Error deleting academic year:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!academicYear) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="flex items-center gap-2">
        <WarningIcon className="text-red-600" />
        Delete Academic Year
      </DialogTitle>
      <DialogContent>
        <Box className="space-y-4">
          <Typography variant="body1">
            Are you sure you want to delete the academic year <strong>&quot;{academicYear.name}&quot;</strong>?
          </Typography>
          
          <Alert severity="warning" className="my-4">
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. The academic year will be permanently deleted.
            </Typography>
          </Alert>

          {academicYear.isActive && (
            <Alert severity="error" className="my-4">
              <Typography variant="body2">
                <strong>Cannot Delete:</strong> This is the currently active academic year. 
                Please set another academic year as active before deleting this one.
              </Typography>
            </Alert>
          )}

          <Box className="bg-gray-50 p-3 rounded">
            <Typography variant="body2" className="text-gray-700">
              <strong>Academic Year Details:</strong><br />
              Name: {academicYear.name}<br />
              Period: {new Date(academicYear.startDate).toLocaleDateString()} - {new Date(academicYear.endDate).toLocaleDateString()}<br />
              Status: {academicYear.isActive ? "Active" : "Inactive"}
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={academicYear.isActive}
          className="bg-red-600 hover:bg-red-700"
        >
          Delete Academic Year
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteAcademicYearModal;
