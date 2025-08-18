import React, { useEffect, useState, useCallback } from "react";
import Button from "@mui/material/Button";
import AddFeesModal from "./AddFeesModal";
import EditFeesModal from "./EditFeesModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ReceiptModal from "./ReceiptModal";
import Tooltip from "@mui/material/Tooltip";
import TableWrapper from "../../component/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import MoneyIcon from "@mui/icons-material/Money";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { useBranch } from "../../context/useBranch";
import { useYear } from "../../context/YearProvider.jsx";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const SETTINGS_KEY = "feesTableSettings";

const Fees = () => {
  const { selected: selectedBranch } = useBranch();
  const { selected: selectedYear } = useYear();
  const [fees, setFees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingFees, setEditingFees] = useState(null);
  const [deletingFees, setDeletingFees] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  console.log({ selectedReceipt });

  // Add serial numbers to fees data
  const feesWithSrNo = fees.map((item, index) => ({
    ...item,
    srNo: index + 1,
  }));

  const columns = [
    {
      field: "receipt_number",
      headerName: "Receipt No.",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <ReceiptLongIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
          <Tooltip title={params.value || ""}>
            <span
              style={{ cursor: "pointer", color: teal[700], fontWeight: 600 }}
              onClick={() => handleViewReceipt(params.row)}
            >
              {params.value || ""}
            </span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "student_name",
      headerName: "Student Name",
      flex: 1,
      minWidth: 150,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <PersonIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
          <Tooltip title={params.value || ""}>
            <span>{params.value || ""}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "roll_number",
      headerName: "Roll No.",
      flex: 0.6,
      minWidth: 90,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Tooltip title={params.value || ""}>
            <span>{params.value || ""}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "class_name",
      headerName: "Class",
      flex: 0.8,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <Tooltip title={params.value || ""}>
            <span>{params.value || ""}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.7,
      minWidth: 100,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <CurrencyRupeeIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
          <Tooltip title={`₹${params.value || 0}`}>
            <span style={{ fontWeight: 600 }}>₹{params.value || 0}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "payment_type",
      headerName: "Payment Type",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const type = (params.value || "").toString().toLowerCase();
        const icon =
          type === "cash" ? (
            <MoneyIcon sx={{ mr: 1, fontSize: 18 }} />
          ) : type === "cheque" ? (
            <AccountBalanceIcon sx={{ mr: 1, fontSize: 18 }} />
          ) : (
            <QrCodeIcon sx={{ mr: 1, fontSize: 18 }} />
          );
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {icon}
            <Tooltip title={params.value || ""}>
              <span
                style={{
                  textTransform: "capitalize",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {params.value || ""}
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: "payee_name",
      headerName: "Payee Name",
      flex: 1,
      minWidth: 130,
      headerAlign: "center",
      align: "left",
      renderCell: (params) => (
        <Tooltip title={params.value || ""}>
          <span>{params.value || ""}</span>
        </Tooltip>
      ),
    },
    {
      field: "payment_date",
      headerName: "Payment Date",
      flex: 0.8,
      minWidth: 120,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <CalendarTodayIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
          <Tooltip title={params.value || ""}>
            <span>{params.value || ""}</span>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      headerAlign: "center",
      align: "center",
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleViewReceipt(params.row)}
          >
            Receipt
          </Button>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row)}
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
        </Box>
      ),
    },
  ];

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.electronAPI.getSetting(SETTINGS_KEY);
        if (settings) {
          setColumnVisibilityModel(settings.columnVisibilityModel || {});
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setSettingsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  // Save settings
  const handleColumnVisibilityModelChange = useCallback(async (newModel) => {
    setColumnVisibilityModel(newModel);
    try {
      const settings = { columnVisibilityModel: newModel };
      await window.electronAPI.setSetting(SETTINGS_KEY, settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  }, []);

  // Fetch fees data
  const fetchFees = useCallback(async () => {
    if (!selectedBranch?.id) return;

    setLoading(true);
    try {
      const result = await window.electronAPI.getFees(
        selectedBranch.id,
        selectedYear?.id || null
      );
      if (result.success) {
        setFees(result.fees);
      } else {
        setError(result.error || "Failed to fetch fees");
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
      setError("Failed to fetch fees");
    } finally {
      setLoading(false);
    }
  }, [selectedBranch?.id, selectedYear?.id]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees, selectedYear?.id]);

  const handleEditClick = (feesRecord) => {
    setEditingFees(feesRecord);
    setShowEditModal(true);
    setError("");
    setSuccess("");
  };

  const handleDeleteClick = (feesRecord) => {
    setDeletingFees(feesRecord);
    setShowDeleteModal(true);
    setError("");
    setSuccess("");
  };

  const handleViewReceipt = async (feesRecord) => {
    try {
      const studentId = feesRecord.student_id || feesRecord.studentId || null;
      console.log({ studentId });
      if (studentId) {
        console.log("here 1");
        let student = null;
        if (window?.electronAPI?.getStudentById) {
          student = await window.electronAPI.getStudentById(studentId);
        } else if (window?.electronAPI?.getStudents && selectedBranch?.id) {
          // Fallback: fetch students list and match by id
          const list = await window.electronAPI.getStudents(
            selectedBranch.id,
            selectedYear?.id || null
          );
          if (Array.isArray(list)) {
            student =
              list.find((s) => String(s.id) === String(studentId)) || null;
          }
        }
        console.log({ student });
        setSelectedReceipt({ ...feesRecord, student });
      } else {
        console.log("here 2");
        setSelectedReceipt(feesRecord);
      }
    } catch (e) {
      console.error("Failed to load student for receipt:", e);
      setSelectedReceipt(feesRecord);
    } finally {
      setShowReceiptModal(true);
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    setSuccess("Fees record added successfully!");
    fetchFees();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingFees(null);
    setSuccess("Fees record updated successfully!");
    fetchFees();
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeletingFees(null);
    setSuccess("Fees record deleted successfully!");
    fetchFees();
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Fees Collection</h1>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowAddModal(true)}
          disabled={loading}
          startIcon={<PaymentIcon />}
        >
          + Collect Fees
        </Button>
      </div>

      <Paper
        elevation={2}
        sx={{ p: 3, flex: 1, minHeight: 0, display: "flex" }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          {settingsLoaded && (
            <TableWrapper
              columns={columns}
              rows={feesWithSrNo}
              pageSize={10}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
              initialState={{
                sorting: { sortModel: [{ field: "srNo", sort: "asc" }] },
              }}
            />
          )}
        </div>
      </Paper>

      <AddFeesModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        setError={setError}
        setLoading={setLoading}
      />

      <EditFeesModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        feesRecord={editingFees}
        onSuccess={handleEditSuccess}
        setError={setError}
        setLoading={setLoading}
      />

      <DeleteConfirmationModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        feesRecord={deletingFees}
        onSuccess={handleDeleteSuccess}
        setError={setError}
        setLoading={setLoading}
      />

      <ReceiptModal
        open={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        feesRecord={selectedReceipt}
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

export default Fees;
