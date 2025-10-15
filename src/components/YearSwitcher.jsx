'use client';

import React, { useState } from "react";
import { 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  IconButton, 
  Tooltip,
  Snackbar,
  Alert 
} from "@mui/material";
import { Add as AddIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { useYear } from "@/context/YearProvider.jsx";
import AddAcademicYearModal from "@/features/academicYears/AddAcademicYearModal";
import AcademicYearsManagementModal from "./AcademicYearsManagementModal";

export default function YearSwitcher({ compact = false, inverted = false }) {
  const { years, selected, setActiveYear, loadYears } = useYear();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [, setLoading] = useState(false);

  const handleChange = async (e) => {
    const id = e.target.value;
    await setActiveYear(id);
  };

  const closeSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <>
      <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1 }}>
        <FormControl fullWidth variant="outlined" size={compact ? "small" : "medium"}>
          <InputLabel id="year-select-label" sx={{ color: inverted ? "#a1a1aa" : undefined }}>
            Academic Year
          </InputLabel>
          <Select
            labelId="year-select-label"
            value={selected?.id || ""}
            onChange={handleChange}
            label="Academic Year"
            sx={{
              ...(inverted
                ? {
                    color: "white",
                    ".MuiOutlinedInput-notchedOutline": { borderColor: "#3f3f46" },
                    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#52525b" },
                    ".MuiSvgIcon-root": { color: "white" },
                  }
                : {}),
            }}
         >
            {years.map((y) => (
              <MenuItem key={y.id} value={y.id}>
                {y.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Tooltip title="Add New Academic Year">
            <IconButton
              size="small"
              onClick={() => setAddModalOpen(true)}
              sx={{ color: inverted ? "white" : "inherit" }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage Academic Years">
            <IconButton
              size="small"
              onClick={() => setManageModalOpen(true)}
              sx={{ color: inverted ? "white" : "inherit" }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Add Academic Year Modal */}
      <AddAcademicYearModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {
          setAddModalOpen(false);
          setSuccess("Academic year added successfully");
          loadYears();
        }}
        setError={setError}
        setLoading={setLoading}
      />

      {/* Manage Academic Years Modal */}
      <AcademicYearsManagementModal
        open={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        onSuccess={(message) => {
          setSuccess(message);
          loadYears();
        }}
        setError={setError}
        setLoading={setLoading}
      />

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
    </>
  );
}
