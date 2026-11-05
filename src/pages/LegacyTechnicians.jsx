import LegacyPage from '../components/LegacyPage.jsx';
import '../styles/technicians.css';
import markup from '../../../CyberHub JS/technicians.html?raw';
import script from '../../../CyberHub JS/technicians.js?raw';

export default function LegacyTechnicians() {
  return <LegacyPage markup={markup} script={script} />;
}
