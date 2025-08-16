import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BranchProvider } from "./context/BranchProvider.jsx";
import { YearProvider } from "./context/YearProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <YearProvider>
      <BranchProvider>
        <App />
      </BranchProvider>
    </YearProvider>
  </StrictMode>
);
