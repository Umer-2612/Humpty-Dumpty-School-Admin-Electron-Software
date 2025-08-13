import { useState } from "react";
import "./App.css";
import Sidebar from "./component/Sidebar";
import MainContent from "./component/MainContent";
import { Box } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

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
