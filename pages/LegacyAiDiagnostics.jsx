import LegacyPage from '../components/LegacyPage.jsx';
import '../styles/ai-diagnostics.css';
import markup from '../../../CyberHub JS/ai-diagnostics.html?raw';
import script from '../../../CyberHub JS/ai-diagnostics.js?raw';

export default function LegacyAiDiagnostics() {
  return <LegacyPage markup={markup} script={script} />;
}
