import React from "react";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import Staff from "../pages/Staff";
import Transport from "../pages/Transport";
import Fees from "../pages/Fees";
import AcademicSettings from "../pages/AcademicSettings";

const MainContent = ({ activePage }) => {
  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <Dashboard />;
      case "Students":
        return <Students />;
      case "Academic Settings":
        return <AcademicSettings />;
      case "Staff":
        return <Staff />;
      case "Transport":
        return <Transport />;
      case "Fees":
        return <Fees />;
      default:
        return <Dashboard />;
    }
  };

  return <div style={{ flexGrow: 1, padding: "20px" }}>{renderPage()}</div>;
};

export default MainContent;
