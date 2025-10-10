import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Button from "@mui/material/Button";
import AddFeesModal from "./AddFeesModal";
import EditFeesModal from "./EditFeesModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ReceiptModal from "./ReceiptModal";
import StudentFeeDetailsModal from "./StudentFeeDetailsModal";
import FeesReportModal from "./FeesReportModal";
import Tooltip from "@mui/material/Tooltip";
import TableWrapper from "../../component/TableWrapper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import MoneyIcon from "@mui/icons-material/Money";
import { teal } from "@mui/material/colors";
import PersonIcon from "@mui/icons-material/Person";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useBranch } from "../../context/useBranch";
import { useYear } from "../../context/YearProvider.jsx";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

const SETTINGS_KEY = "feesTableSettings";

const Fees = () => {
  const { selected: selectedBranch } = useBranch();
  const { selected: selectedYear } = useYear();
  const [fees, setFees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingFees, setEditingFees] = useState(null);
  const [deletingFees, setDeletingFees] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const searchTimer = useRef(null);

  console.log({ selectedReceipt });

  // Add serial numbers to fees data
  const displayedFees = useMemo(() => {
    const q = (search || "").trim();
    return q ? searchResults : fees;
  }, [fees, search, searchResults]);

  const feesWithSrNo = displayedFees.map((item, index) => ({
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
      renderCell: (params) => {
        const raw = params.value || "";
        // Normalize legacy formats: c1->C-1, b2->B-2; keep already-formatted values as-is
        const normalized = (() => {
          if (/^[cb]\d+$/i.test(raw)) {
            const p = raw[0].toUpperCase();
            const n = raw.slice(1);
            return `${p}-${n}`;
          }
          return raw;
        })();
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
            <ReceiptLongIcon sx={{ mr: 1, color: teal[700], fontSize: 18 }} />
            <Tooltip title={normalized}>
              <span
                style={{ cursor: "pointer", color: teal[700], fontWeight: 600 }}
                onClick={() => handleViewReceipt(params.row)}
              >
                {normalized}
              </span>
            </Tooltip>
          </Box>
        );
      },
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
      width: 300,
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
            variant="outlined"
            color="info"
            size="small"
            onClick={() => handleViewDetails(params.row)}
          >
            Details
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

  // Debounced client-side search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const q = (search || "").trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    searchTimer.current = setTimeout(() => {
      setSearching(true);
      try {
        const filtered = fees.filter((record) => {
          const tokens = [
            record.receipt_number,
            record.student_name,
            record.roll_number,
            record.class_name,
            record.payment_type,
            record.payee_name,
            record.payment_date,
            record.amount,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return tokens.includes(q);
        });
        setSearchResults(filtered);
      } catch (e) {
        console.error("Fees search error:", e);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, fees]);

  const fetchStudentForRecord = useCallback(
    async (feesRecord) => {
      if (!feesRecord) return feesRecord;
      if (feesRecord.student) return { ...feesRecord };
      const studentId = feesRecord.student_id || feesRecord.studentId || null;
      if (!studentId) return { ...feesRecord };
      try {
        let student = null;
        if (window?.electronAPI?.getStudentById) {
          student = await window.electronAPI.getStudentById(studentId);
        } else if (window?.electronAPI?.getStudents && selectedBranch?.id) {
          const list = await window.electronAPI.getStudents(
            selectedBranch.id,
            selectedYear?.id || null
          );
          const studentsList = Array.isArray(list) ? list : list?.students;
          if (Array.isArray(studentsList)) {
            student =
              studentsList.find((s) => String(s.id) === String(studentId)) ||
              null;
          }
        }
        return { ...feesRecord, student };
      } catch (e) {
        console.error("Failed to load student for record:", e);
        return { ...feesRecord };
      }
    },
    [selectedBranch?.id, selectedYear?.id]
  );

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
    const enrichedRecord = await fetchStudentForRecord(feesRecord);
    setSelectedReceipt(enrichedRecord);
    setShowReceiptModal(true);
  };

  const handleViewDetails = async (feesRecord) => {
    const enrichedRecord = await fetchStudentForRecord(feesRecord);
    setSelectedDetails(enrichedRecord);
    setShowDetailsModal(true);
  };

  const handleAddSuccess = async (result = {}, submittedPayload = {}) => {
    setShowAddModal(false);
    setSuccess("Fees record added successfully!");
    fetchFees();
    // Notify other parts of the app (e.g., Students page) to refresh balances
    try {
      window.dispatchEvent(new CustomEvent("fees-updated", { detail: { action: "add" } }));
    } catch (e) {
      console.warn("Failed dispatching fees-updated event", e);
    }

    // Automatically open receipt modal for the newly added fee
    try {
      const receiptNumber = result?.receipt_number;
      if (receiptNumber && window?.electronAPI?.getFeesReceipt) {
        const receiptRes = await window.electronAPI.getFeesReceipt(receiptNumber);
        const record =
          receiptRes && receiptRes.success
            ? receiptRes.receipt
            : null;
        if (record) {
          await handleViewReceipt(record);
        }
      } else if (submittedPayload?.student_id) {
        // Fallback: use submitted payload to build a minimal record if receipt lookup fails
        await handleViewReceipt({
          ...submittedPayload,
          receipt_number: result?.receipt_number,
          id: result?.id,
        });
      }
    } catch (err) {
      console.error("Failed to auto-open receipt modal:", err);
    }

    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingFees(null);
    setSuccess("Fees record updated successfully!");
    fetchFees();
    try {
      window.dispatchEvent(new CustomEvent("fees-updated", { detail: { action: "edit" } }));
    } catch (e) {
      console.warn("Failed dispatching fees-updated event", e);
    }
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    setDeletingFees(null);
    setSuccess("Fees record deleted successfully!");
    fetchFees();
    try {
      window.dispatchEvent(new CustomEvent("fees-updated", { detail: { action: "delete" } }));
    } catch (e) {
      console.warn("Failed dispatching fees-updated event", e);
    }
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
        <Stack direction="row" spacing={2} alignItems="center">
          <Tooltip title={search || "Search by name, receipt, class"} arrow>
            <TextField
              size="small"
              placeholder="Search fees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                minWidth: 260,
                "& .MuiInputBase-input": {
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {searching ? (
                      <CircularProgress size={16} />
                    ) : search ? (
                      <IconButton size="small" onClick={() => setSearch("")}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </InputAdornment>
                ),
              }}
            />
          </Tooltip>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowReportModal(true)}
            disabled={loading}
          >
            Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            startIcon={<PaymentIcon />}
          >
            + Collect Fees
          </Button>
        </Stack>
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
      <StudentFeeDetailsModal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDetails(null);
        }}
        feesRecord={selectedDetails}
      />

      <FeesReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
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
