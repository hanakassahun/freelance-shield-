import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContractGenerator from './pages/ContractGenerator';
import ClientRiskScoring from './pages/ClientRiskScoring';
import InvoiceTracker from './pages/InvoiceTracker';
import RedFlagDetector from './pages/RedFlagDetector';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contracts" element={<ContractGenerator />} />
          <Route path="/clients" element={<ClientRiskScoring />} />
          <Route path="/invoices" element={<InvoiceTracker />} />
          <Route path="/red-flags" element={<RedFlagDetector />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

