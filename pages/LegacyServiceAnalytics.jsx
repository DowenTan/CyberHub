import LegacyPage from '../components/LegacyPage.jsx';
import '../styles/service-analytics.css';
import markup from '../../../CyberHub JS/service-analytics.html?raw';
import script from '../../../CyberHub JS/service-analytics.js?raw';

export default function LegacyServiceAnalytics() {
  return <LegacyPage markup={markup} script={script} usesCharts />;
}
