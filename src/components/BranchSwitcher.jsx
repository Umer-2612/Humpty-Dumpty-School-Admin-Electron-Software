'use client';

import React, { useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Settings as SettingsIcon } from "@mui/icons-material";
import { useBranch } from "@/context/useBranch";
import AddBranchModal from "@/features/branches/AddBranchModal";
import BranchesManagementModal from "./BranchesManagementModal";

const BranchSwitcher = ({ compact = false, inverted = false }) => {
  const { branches, selected, setSelected, loadBranches } = useBranch();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async (event) => {
    const branchId = event.target.value;
    setSelected(branchId);
  };

  const closeSnackbar = () => {
    setError("");
    setSuccess("");
  };

  return (
    <>
      <Box sx={{ width: "100%", display: "flex", alignItems: "center", gap: 1 }}>
        <FormControl
          fullWidth
          variant="outlined"
          size={compact ? "small" : "medium"}
        >
          <InputLabel
            id="branch-select-label"
            sx={{ color: inverted ? "#a1a1aa" : undefined }}
          >
            Branch
          </InputLabel>
          <Select
            labelId="branch-select-label"
            value={selected?.id || ""}
            onChange={handleChange}
            label="Branch"
            sx={{
              ...(inverted
                ? {
                    color: "white",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3f3f46",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#52525b",
                    },
                    ".MuiSvgIcon-root": { color: "white" },
                  }
                : {}),
            }}
          >
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Tooltip title="Add Branch">
            <span>
              <IconButton
                size="small"
                onClick={() => setAddModalOpen(true)}
                sx={{ color: inverted ? "white" : "inherit" }}
                disabled={loading}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Manage Branches">
            <span>
              <IconButton
                size="small"
                onClick={() => setManageModalOpen(true)}
                sx={{ color: inverted ? "white" : "inherit" }}
                disabled={loading}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <AddBranchModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        setError={setError}
        setLoading={setLoading}
        onSuccess={async (branch) => {
          setAddModalOpen(false);
          await loadBranches({ forceSelectId: branch?.id });
          setSuccess(`Branch "${branch?.name}" added successfully`);
        }}
      />

      <BranchesManagementModal
        open={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        setError={setError}
        setLoading={setLoading}
        onSuccess={async (message) => {
          if (message) setSuccess(message);
          await loadBranches();
        }}
      />

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeSnackbar} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BranchSwitcher;
