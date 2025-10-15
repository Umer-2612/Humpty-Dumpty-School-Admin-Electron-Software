'use client';
import api from "@/lib/api";

import React, { useState, useEffect, useCallback } from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import PersonIcon from "@mui/icons-material/Person";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PhoneIcon from "@mui/icons-material/Phone";
import { teal } from "@mui/material/colors";
import TableWrapper from "@/components/TableWrapper";
import AddTransportModal from "./AddTransportModal";
import EditTransportModal from "./EditTransportModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const Transport = () => {
  const [transport, setTransport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTransport, setEditingTransport] = useState(null);
  const [deletingTransport, setDeletingTransport] = useState(null);

  const fetchTransport = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTransport();
      setTransport(data);
    } catch (err) {
      setError("Failed to fetch transport data");
      console.error("Error fetching transport:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransport();
  }, [fetchTransport]);

  const handleEditClick = (transportItem) => {
    setEditingTransport(transportItem);
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (transportItem) => {
    setDeletingTransport(transportItem);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setSuccess("Transport entry added successfully!");
    fetchTransport();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingTransport(null);
    setSuccess("Transport entry updated successfully!");
    fetchTransport();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeletingTransport(null);
    setSuccess("Transport entry deleted successfully!");
    fetchTransport();
    setTimeout(() => setSuccess(""), 3000);
  };

  // Add serial numbers to transport data
  const transportWithSrNo = transport.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  const columns = [
    {
      field: "srNo",
      headerName: "Sr No",
      width: 100,
      headerAlign: "center",
      align: "center",
      type: "number",
      disableColumnMenu: true,
    },
    {
      field: "driver_name",
      headerName: "Driver Name",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Box
          sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1 }}
        >
          <PersonIcon sx={{ color: teal[600], fontSize: 18 }} />
          <span>{params.value}</span>
        </Box>
      ),
    },
    {
      field: "driver_route",
      headerName: "Route",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Box
          sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1 }}
        >
          <RouteIcon sx={{ color: teal[600], fontSize: 18 }} />
          <span>{params.value}</span>
        </Box>
      ),
    },
    {
      field: "driver_car",
      headerName: "Vehicle",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Box
          sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1 }}
        >
          <DirectionsCarIcon sx={{ color: teal[600], fontSize: 18 }} />
          <span>{params.value}</span>
        </Box>
      ),
    },
    {
      field: "driver_car_number",
      headerName: "Vehicle Number",
      flex: 1,
      minWidth: 130,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
          }}
        >
          <span style={{ fontWeight: 600 }}>{params.value}</span>
        </Box>
      ),
    },
    {
      field: "driver_contact",
      headerName: "Contact",
      flex: 1,
      minWidth: 120,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Box
          sx={{ display: "flex", alignItems: "center", height: "100%", gap: 1 }}
        >
          <PhoneIcon sx={{ color: teal[600], fontSize: 18 }} />
          <span>{params.value}</span>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => (
        <div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDeleteClick(params.row)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Transport</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          + Add Transport
        </Button>
      </div>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DirectionsBusIcon sx={{ mr: 1, color: teal[700], fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Transport
          </Typography>
        </Box> */}
        <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
          <TableWrapper
            columns={columns}
            rows={transportWithSrNo}
            pageSize={10}
            initialState={{
              sorting: { sortModel: [{ field: "srNo", sort: "asc" }] },
            }}
            loading={loading}
          />
        </div>
      </Paper>

      <AddTransportModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        setError={setError}
        setLoading={setLoading}
      />

      <EditTransportModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTransport(null);
        }}
        transport={editingTransport}
        onSuccess={handleEditSuccess}
        setError={setError}
        setLoading={setLoading}
      />

      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        transport={deletingTransport}
        onSuccess={handleDeleteSuccess}
        setError={setError}
        setLoading={setLoading}
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

export default Transport;
