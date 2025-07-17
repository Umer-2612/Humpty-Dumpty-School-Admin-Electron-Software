import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BranchProvider } from "./context/BranchProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BranchProvider>
      <App />
    </BranchProvider>
  </StrictMode>
);
