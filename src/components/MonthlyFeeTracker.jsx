'use client';

import React, { useState, useEffect, useCallback } from "react";
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
import api from "@/lib/api";

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

  const fetchMonthsStatus = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setError("");

    try {
      const result = await api.getStudentMonthsStatus(studentId);
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
  }, [studentId, onError]);

  useEffect(() => {
    if (studentId) {
      fetchMonthsStatus();
    }
  }, [studentId, fetchMonthsStatus]);

  // Helper function to get the latest paid month index (0-11)
  const getLatestPaidMonthIndex = () => {
    for (let i = months.length - 1; i >= 0; i--) {
      const month = months[i];
      const status = monthsStatus[month];
      if (status?.paid) {
        return i;
      }
    }
    return -1; // No months paid
  };

  // Helper function to determine if a month should be marked as paid based on sequential logic
  const shouldMonthBePaid = (monthIndex) => {
    const latestPaidIndex = getLatestPaidMonthIndex();
    return monthIndex <= latestPaidIndex;
  };

  const getMonthChipColor = (month, monthIndex) => {
    const status = monthsStatus[month];
    const shouldBePaid = shouldMonthBePaid(monthIndex);

    if (status?.paid || shouldBePaid) {
      return green[500];
    }
    return grey[300];
  };

  const getMonthIcon = (month, monthIndex) => {
    const status = monthsStatus[month];
    const shouldBePaid = shouldMonthBePaid(monthIndex);

    if (status?.paid || shouldBePaid) {
      return <CheckCircleIcon fontSize="small" />;
    }
    return <PendingIcon fontSize="small" />;
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
    const latestPaidIndex = getLatestPaidMonthIndex();
    return latestPaidIndex >= 0 ? latestPaidIndex + 1 : 0;
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
        {months.map((month, index) => {
          const status = monthsStatus[month];
          const isPaid = status?.paid || false;
          const shouldBePaid = shouldMonthBePaid(index);
          const displayAsPaid = isPaid || shouldBePaid;
          const amount = status?.amount || 0;
          const paidDate = status?.paid_date;

          return (
            <Grid item xs={6} sm={4} md={3} key={month}>
              <Tooltip
                title={
                  displayAsPaid
                    ? `Paid: ${formatAmount(amount)}${
                        paidDate ? ` on ${paidDate}` : ""
                      }${shouldBePaid && !isPaid ? " (Sequential)" : ""}`
                    : "Not paid yet"
                }
                arrow
                placement="top"
              >
                <Chip
                  icon={getMonthIcon(month, index)}
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
                      {displayAsPaid && (
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
                    backgroundColor: getMonthChipColor(month, index),
                    color: displayAsPaid ? "white" : grey[600],
                    fontWeight: 600,
                    border: displayAsPaid
                      ? `2px solid ${green[600]}`
                      : `1px solid ${grey[400]}`,
                    "&:hover": {
                      backgroundColor: displayAsPaid ? green[600] : grey[400],
                    },
                    "& .MuiChip-icon": {
                      color: displayAsPaid ? "white" : grey[600],
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
