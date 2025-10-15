'use client';

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import api from "@/lib/api";
import EditAcademicYearModal from "@/features/academicYears/EditAcademicYearModal";
import DeleteAcademicYearModal from "@/features/academicYears/DeleteAcademicYearModal";

const AcademicYearsManagementModal = ({ open, onClose, onSuccess, setError, setLoading }) => {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLocalLoading] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);

  const fetchAcademicYears = useCallback(async () => {
    setLocalLoading(true);
    try {
      const years = await api.listAcademicYears();
      setAcademicYears(years || []);
    } catch (err) {
      setError("Failed to fetch academic years");
      console.error("Error fetching academic years:", err);
    } finally {
      setLocalLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    if (open) {
      fetchAcademicYears();
    }
  }, [open, fetchAcademicYears]);

  const handleSetActive = async (yearId) => {
    setLoading(true);
    try {
      const result = await api.setActiveAcademicYear(yearId);
      if (result.success !== false) {
        onSuccess("Academic year activated successfully");
        fetchAcademicYears();
      } else {
        setError(result.error || "Failed to activate academic year");
      }
    } catch (err) {
      setError("Failed to activate academic year");
      console.error("Error activating academic year:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (year) => {
    setSelectedYear(year);
    setEditModalOpen(true);
  };

  const handleDelete = (year) => {
    setSelectedYear(year);
    setDeleteModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle className="flex justify-between items-center">
          Manage Academic Years
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box className="text-center py-8">
              <Typography>Loading...</Typography>
            </Box>
          ) : academicYears.length === 0 ? (
            <Box className="text-center py-8">
              <Typography>No academic years found</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {academicYears.map((year) => (
                <Grid item xs={12} sm={6} key={year.id}>
                  <Card variant="outlined" className="h-full">
                    <CardContent>
                      <Box className="flex justify-between items-start mb-2">
                        <Typography variant="subtitle1" component="div">
                          {year.name}
                        </Typography>
                        {year.isActive ? (
                          <Chip
                            label="Active"
                            color="success"
                            size="small"
                            icon={<ActiveIcon />}
                          />
                        ) : (
                          <Chip
                            label="Set Active"
                            color="default"
                            size="small"
                            onClick={() => handleSetActive(year.id)}
                            clickable
                            className="cursor-pointer hover:bg-green-100"
                          />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" className="mb-1">
                        <strong>Start:</strong> {formatDate(year.startDate)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className="mb-3">
                        <strong>End:</strong> {formatDate(year.endDate)}
                      </Typography>
                      
                      <Box className="flex gap-1 justify-end">
                        <Tooltip title="Edit Academic Year">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(year)}
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Academic Year">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(year)}
                            className="text-red-600 hover:bg-red-50"
                            disabled={year.isActive}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Modal */}
      <EditAcademicYearModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedYear(null);
        }}
        academicYear={selectedYear}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedYear(null);
          onSuccess("Academic year updated successfully");
          fetchAcademicYears();
        }}
        setError={setError}
        setLoading={setLoading}
      />

      {/* Delete Modal */}
      <DeleteAcademicYearModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedYear(null);
        }}
        academicYear={selectedYear}
        onSuccess={() => {
          setDeleteModalOpen(false);
          setSelectedYear(null);
          onSuccess("Academic year deleted successfully");
          fetchAcademicYears();
        }}
        setError={setError}
        setLoading={setLoading}
      />
    </>
  );
};

export default AcademicYearsManagementModal;
