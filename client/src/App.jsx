import { useState } from "react";
import "./App.css";
import Sidebar from "./component/Sidebar";
import MainContent from "./component/MainContent";
import { Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ display: "flex", height: "100vh" }}>
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 3, backgroundColor: "#18181b" }}
        >
          <MainContent activePage={activePage} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
