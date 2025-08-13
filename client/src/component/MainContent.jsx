import React from "react";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/student/Students";
import Staff from "../pages/staff/Staff";
import Transport from "../pages/transport/Transport";
import Fees from "../pages/fees/Fees";
import AcademicSettings from "../pages/academicSettings/AcademicSettings";

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

  return (
    <div
      style={{
        flexGrow: 1,
        padding: "20px",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {renderPage()}
    </div>
  );
};

export default MainContent;
