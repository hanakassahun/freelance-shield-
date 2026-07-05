import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ContractGenerator from './pages/ContractGenerator';
import ContractEditor from './pages/ContractEditor';
import ClientRiskScoring from './pages/ClientRiskScoring';
import InvoiceTracker from './pages/InvoiceTracker';
import RedFlagDetector from './pages/RedFlagDetector';
import PaymentAnalytics from './pages/PaymentAnalytics';
import Projects from './pages/Projects';
import TimeTracking from './pages/TimeTracking';
import Expenses from './pages/Expenses';
import Documents from './pages/Documents';
import Communications from './pages/Communications';
import RecurringInvoices from './pages/RecurringInvoices';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contracts" element={<ContractGenerator />} />
          <Route path="/contract-editor" element={<ContractEditor />} />
          <Route path="/clients" element={<ClientRiskScoring />} />
          <Route path="/invoices" element={<InvoiceTracker />} />
          <Route path="/red-flags" element={<RedFlagDetector />} />
          <Route path="/analytics" element={<PaymentAnalytics />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/communications" element={<Communications />} />
          <Route path="/recurring-invoices" element={<RecurringInvoices />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

