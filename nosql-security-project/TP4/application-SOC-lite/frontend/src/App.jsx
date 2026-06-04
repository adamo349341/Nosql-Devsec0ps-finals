import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Loginpage";
import Dashboard from "./pages/DashboardPage";
import Logs from "./pages/LogsPage";
import Incidents from "./pages/IncidentPage";
import IncidentDetailPage from "./pages/IncidentDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;