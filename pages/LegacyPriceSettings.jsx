import LegacyPage from '../components/LegacyPage.jsx';
import '../styles/price-settings.css';
import markup from '../../../CyberHub JS/price-settings.html?raw';
import script from '../../../CyberHub JS/price-settings.js?raw';

export default function LegacyPriceSettings() {
  return <LegacyPage markup={markup} script={script} />;
}
