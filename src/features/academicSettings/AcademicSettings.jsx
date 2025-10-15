'use client';
import api from "@/lib/api";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Button from "@mui/material/Button";
import TableWrapper from "@/components/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { teal } from "@mui/material/colors";
import SchoolIcon from "@mui/icons-material/School";
import { useBranch } from "@/context/useBranch";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import EditClassEntryModal from "./EditClassEntryModal";
import DeleteClassEntryModal from "./DeleteClassEntryModal";
import AddClassEntryModal from "./AddClassEntryModal";

const SETTINGS_KEY = "classesTableSettings";

const Classes = () => {
  const { selected: selectedBranch } = useBranch();
  const [classEntries, setClassEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Local UI state for modals/actions
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);

  // Inline Add form state removed; handled inside AddClassEntryModal

  // Unified Academic Settings (class entries)

  // Unified class entries (new)
  const entriesWithSrNo = classEntries.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  // Handlers stabilized with useCallback (used by renderers in columns)
  const handleEditEntryClick = useCallback((entry) => {
    setEditingEntry(entry);
    setShowEditEntryModal(true);
    setError("");
    setSuccess("");
  }, []);

  const handleDeleteEntryClick = useCallback((entry) => {
    setDeletingEntry(entry);
    // Delete modal opens when deletingEntry is set
    setError("");
    setSuccess("");
  }, []);

  // Base columns memoized so identity is stable across renders
  const baseColumns = useMemo(
    () => [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 70,
        headerAlign: "center",
        align: "center",
        type: "number",
      },
      { field: "class_name", headerName: "Class", flex: 1, minWidth: 160 },
      { field: "shift_name", headerName: "Shift", flex: 1, minWidth: 140 },
      { field: "start_time", headerName: "Start", width: 110 },
      { field: "end_time", headerName: "End", width: 110 },
      {
        field: "division_count",
        headerName: "Divisions",
        width: 120,
        headerAlign: "center",
        align: "center",
        type: "number",
      },
      {
        field: "term1_fee",
        headerName: "Term 1",
        width: 120,
        renderCell: (params) => {
          const value = params.value;
          if (!value || value === 0) return "₹0";
          return `₹${Number(value).toLocaleString("en-IN")}`;
        },
      },
      {
        field: "term2_fee",
        headerName: "Term 2",
        width: 120,
        renderCell: (params) => {
          const value = params.value;
          if (!value || value === 0) return "₹0";
          return `₹${Number(value).toLocaleString("en-IN")}`;
        },
      },
      {
        field: "books_charge",
        headerName: "Books",
        width: 120,
        renderCell: (params) => {
          const value = params.value;
          if (!value || value === 0) return "₹0";
          return `₹${Number(value).toLocaleString("en-IN")}`;
        },
      },
      {
        field: "total_fees",
        headerName: "Total Fees",
        width: 140,
        renderCell: (params) => {
          const value = params.value;
          if (!value || value === 0) return "₹0";
          return `₹${Number(value).toLocaleString("en-IN")}`;
        },
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        sortable: false,
        renderCell: (params) => (
          <div>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => handleEditEntryClick(params.row)}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => handleDeleteEntryClick(params.row)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteEntryClick, handleEditEntryClick]
  );

  // Compute default width from header text length (approx 9px per char + padding)
  const computeHeaderWidth = useCallback((header) => {
    const len = (header || "").length;
    const px = Math.round(len * 9 + 24); // character width + padding
    return Math.max(70, Math.min(260, px));
  }, []);

  // Apply auto width for columns without explicit width or flex
  const columnsWithAutoWidth = useMemo(() => {
    return baseColumns.map((col) => {
      if (col.flex || col.width) return col;
      return { ...col, width: computeHeaderWidth(col.headerName) };
    });
  }, [baseColumns, computeHeaderWidth]);

  useEffect(() => {
    let mounted = true;
    api.getSetting(SETTINGS_KEY).then((settings) => {
      if (mounted && settings) {
        setColumnVisibilityModel(settings.columnVisibilityModel || {});
      }
      setSettingsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleColumnVisibilityModelChange = useCallback((newModel) => {
    setColumnVisibilityModel(newModel);
    api.setSetting(SETTINGS_KEY, {
      columnVisibilityModel: newModel,
    });
  }, []);

  const fetchClassEntries = useCallback(async () => {
    if (!selectedBranch?.id) {
      setClassEntries([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.listClassesByBranch(
        selectedBranch.id
      );
      setClassEntries(data || []);
    } catch (err) {
      console.error("[AcademicSettings] Failed to fetch class entries", err);
      setError("Failed to fetch class entries");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  // Add behavior handled by AddClassEntryModal

  useEffect(() => {
    fetchClassEntries();
  }, [fetchClassEntries, selectedBranch]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {/* Unified Class Entries */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SchoolIcon sx={{ mr: 1, color: teal[700], fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Classes — {selectedBranch?.name || "Select Branch"}
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Manage classes for this branch
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddEntryModal(true)}
            disabled={loading || !selectedBranch}
          >
            + Add Class
          </Button>
        </Box>
        <div
          style={{ width: "100%", height: "60vh", minHeight: 0, marginTop: 24 }}
        >
          {settingsLoaded && (
            <TableWrapper
              columns={columnsWithAutoWidth}
              rows={entriesWithSrNo}
              pageSize={5}
              hidePageSize
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            />
          )}
        </div>
      </Paper>
      {/* Legacy classes/shifts UI removed */}

      {/* Add Class Modal */}
      <AddClassEntryModal
        open={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        branchId={selectedBranch?.id}
        onSuccess={async () => {
          setShowAddEntryModal(false);
          await fetchClassEntries();
          setSuccess("Class added successfully");
        }}
        setError={setError}
        setLoading={setLoading}
      />
      {/* Edit Class Modal */}
      <EditClassEntryModal
        open={showEditEntryModal}
        onClose={() => {
          setShowEditEntryModal(false);
          setEditingEntry(null);
        }}
        entry={editingEntry}
        loading={loading}
        setError={setError}
        setLoading={setLoading}
        onSaved={async () => {
          setShowEditEntryModal(false);
          setEditingEntry(null);
          await fetchClassEntries();
          setSuccess("Class updated successfully");
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteClassEntryModal
        open={Boolean(deletingEntry)}
        onClose={() => setDeletingEntry(null)}
        entry={deletingEntry}
        loading={loading}
        setError={setError}
        setLoading={setLoading}
        onDeleted={async () => {
          setDeletingEntry(null);
          await fetchClassEntries();
          setSuccess("Class deleted successfully");
        }}
      />

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={() => setSuccess("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Classes;
