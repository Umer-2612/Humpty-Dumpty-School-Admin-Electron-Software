import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { teal, green, grey } from "@mui/material/colors";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

const MonthlyFeeTracker = ({ studentId, onError }) => {
  const [monthsStatus, setMonthsStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    if (studentId) {
      fetchMonthsStatus();
    }
  }, [studentId]);

  const fetchMonthsStatus = async () => {
    if (!studentId) return;

    setLoading(true);
    setError("");

    try {
      const result = await window.electronAPI.getStudentMonthsStatus(studentId);
      if (result.success) {
        setMonthsStatus(result.monthsStatus || {});
      } else {
        const errorMsg = result.error || "Failed to fetch months status";
        setError(errorMsg);
        if (onError) onError(errorMsg);
      }
    } catch (err) {
      console.error("Failed to fetch months status", err);
      const errorMsg = "Failed to fetch months status";
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getMonthChipColor = (month) => {
    const status = monthsStatus[month];
    if (!status) return grey[300];
    return status.paid ? green[500] : grey[300];
  };

  const getMonthIcon = (month) => {
    const status = monthsStatus[month];
    if (!status) return <PendingIcon fontSize="small" />;
    return status.paid ? (
      <CheckCircleIcon fontSize="small" />
    ) : (
      <PendingIcon fontSize="small" />
    );
  };

  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  const getTotalPaidAmount = () => {
    return Object.values(monthsStatus).reduce((total, status) => {
      return total + (status?.amount || 0);
    }, 0);
  };

  const getPaidMonthsCount = () => {
    return Object.values(monthsStatus).filter((status) => status?.paid).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
        <Typography sx={{ ml: 2 }}>Loading months status...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ color: teal[700], fontWeight: 600, mb: 1 }}
        >
          Monthly Fee Payment Status
        </Typography>

        {/* Summary Stats */}
        <Box sx={{ display: "flex", gap: 3, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircleIcon sx={{ color: green[500], fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Paid Months: {getPaidMonthsCount()}/12
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CurrencyRupeeIcon sx={{ color: teal[600], fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Total Paid: {formatAmount(getTotalPaidAmount())}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Monthly Status Grid */}
      <Grid container spacing={1.5}>
        {months.map((month) => {
          const status = monthsStatus[month];
          const isPaid = status?.paid || false;
          const amount = status?.amount || 0;
          const paidDate = status?.paid_date;

          return (
            <Grid item xs={6} sm={4} md={3} key={month}>
              <Tooltip
                title={
                  isPaid
                    ? `Paid: ${formatAmount(amount)}${
                        paidDate ? ` on ${paidDate}` : ""
                      }`
                    : "Not paid yet"
                }
                arrow
                placement="top"
              >
                <Chip
                  icon={getMonthIcon(month)}
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, lineHeight: 1 }}
                      >
                        {month.substring(0, 3)}
                      </Typography>
                      {isPaid && (
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.65rem", lineHeight: 1 }}
                        >
                          {formatAmount(amount)}
                        </Typography>
                      )}
                    </Box>
                  }
                  sx={{
                    width: "100%",
                    height: 48,
                    backgroundColor: getMonthChipColor(month),
                    color: isPaid ? "white" : grey[600],
                    fontWeight: 600,
                    border: isPaid
                      ? `2px solid ${green[600]}`
                      : `1px solid ${grey[400]}`,
                    "&:hover": {
                      backgroundColor: isPaid ? green[600] : grey[400],
                    },
                    "& .MuiChip-icon": {
                      color: isPaid ? "white" : grey[600],
                    },
                  }}
                />
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>

      {/* Legend */}
      <Box
        sx={{
          mt: 3,
          display: "flex",
          gap: 2,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CheckCircleIcon sx={{ color: green[500], fontSize: 16 }} />
          <Typography variant="caption">Paid</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <PendingIcon sx={{ color: grey[500], fontSize: 16 }} />
          <Typography variant="caption">Pending</Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MonthlyFeeTracker;
