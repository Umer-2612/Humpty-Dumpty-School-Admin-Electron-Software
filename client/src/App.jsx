import { useState } from "react";
import "./App.css";
import Sidebar from "./component/Sidebar";
import MainContent from "./component/MainContent";
import { Box, Button, Stack } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import YearSwitcher from "./component/YearSwitcher";
import { useYear } from "./context/YearProvider.jsx";
import YearManagerDialog from "./component/YearManagerDialog.jsx";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [yearMgrOpen, setYearMgrOpen] = useState(false);
  const { hasChosenYear, loading: yearLoading } = useYear();

  // Gate: Require explicit year selection before app loads
  if (yearLoading || !hasChosenYear) {
    return (
      <ThemeProvider theme={theme}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            bgcolor: theme.palette.background.default,
            p: 3,
          }}
        >
          <Stack spacing={2} sx={{ width: 360, maxWidth: "90vw" }}>
            <YearSwitcher compact={false} />
            {/* <Button variant="outlined" onClick={() => setYearMgrOpen(true)}>
              Manage Academic Years
            </Button> */}
          </Stack>
        </Box>
        <YearManagerDialog
          open={yearMgrOpen}
          onClose={() => setYearMgrOpen(false)}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: theme.palette.background.default,
            height: "100vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MainContent activePage={activePage} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
