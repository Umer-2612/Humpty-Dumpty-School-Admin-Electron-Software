import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#00b894" }, // Teal
    secondary: { main: "#2563eb" }, // Blue
    background: {
      default: "#f4f6fa",
      paper: "#fff",
    },
    text: {
      primary: "#18181b",
      secondary: "#64748b",
    },
    success: { main: "#34d399" },
    error: { main: "#ef4444" },
    warning: { main: "#ffd23f" },
    divider: "#e5e7eb",
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#18181b",
          color: "#fff",
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          color: "#18181b",
        },
        columnHeaders: {
          backgroundColor: "#f4f6fa",
          color: "#18181b",
        },
        row: {
          "&:hover": {
            backgroundColor: "#e0e7ef",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
