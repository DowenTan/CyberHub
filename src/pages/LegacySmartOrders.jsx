import LegacyPage from '../components/LegacyPage.jsx';
import '../styles/smart-orders.css';
import markup from '../../../CyberHub JS/smart-orders.html?raw';
import script from '../../../CyberHub JS/smart-orders.js?raw';

export default function LegacySmartOrders() {
  return <LegacyPage markup={markup} script={script} />;
}
