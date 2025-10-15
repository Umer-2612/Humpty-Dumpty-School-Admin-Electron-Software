'use client';

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BranchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useBranch } from "@/context/useBranch";
import EditBranchModal from "@/features/branches/EditBranchModal";
import DeleteBranchModal from "@/features/branches/DeleteBranchModal";

const BranchesManagementModal = ({
  open,
  onClose,
  onSuccess,
  setError,
  setLoading,
}) => {
  const { branches, selected, loadBranches } = useBranch();
  const [editBranch, setEditBranch] = useState(null);
  const [deleteBranch, setDeleteBranch] = useState(null);

  useEffect(() => {
    if (open) {
      loadBranches();
    }
  }, [open, loadBranches]);

  const branchCards = useMemo(() => branches || [], [branches]);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle className="flex justify-between items-center">
          Manage Branches
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {branchCards.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography>No branches found</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {branchCards.map((branch) => {
                const isActive =
                  selected && String(selected.id) === String(branch.id);
                return (
                  <Grid item xs={12} sm={6} key={branch.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={1.5}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Stack direction="row" spacing={1} alignItems="center">
                              <BranchIcon fontSize="small" color="primary" />
                              <Typography variant="subtitle1">
                                {branch.name}
                              </Typography>
                            </Stack>
                            {isActive && (
                              <Chip color="primary" size="small" label="Selected" />
                            )}
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                            <Tooltip title="Edit Branch">
                              <IconButton
                                size="small"
                                onClick={() => setEditBranch(branch)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Branch">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteBranch(branch)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <EditBranchModal
        open={Boolean(editBranch)}
        onClose={() => setEditBranch(null)}
        branch={editBranch}
        setError={setError}
        setLoading={setLoading}
        onSuccess={(updated) => {
          onSuccess?.("Branch updated successfully", updated);
          setEditBranch(null);
          loadBranches();
        }}
      />

      <DeleteBranchModal
        open={Boolean(deleteBranch)}
        onClose={() => setDeleteBranch(null)}
        branch={deleteBranch}
        setError={setError}
        setLoading={setLoading}
        onSuccess={() => {
          onSuccess?.("Branch deleted successfully");
          setDeleteBranch(null);
          loadBranches();
        }}
      />
    </>
  );
};

export default BranchesManagementModal;
