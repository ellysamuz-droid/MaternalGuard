import { Routes, Route } from 'react-router-dom';
import AppShell from './components/Layout/AppShell.jsx';
import PatientDashboard from './components/Dashboard/PatientDashboard.jsx';
import PatientDetail from './components/PatientDetail/PatientDetail.jsx';
import ExamForm from './components/ExamForm/ExamForm.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<PatientDashboard />} />
        <Route path="/pasien/:patientId" element={<PatientDetail />} />
        <Route path="/periksa/:patientId" element={<ExamForm />} />
      </Route>
    </Routes>
  );
}
