import React from "react";
import "./styles.css";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <Dashboard />
    </div>
  );
}

export default App;
