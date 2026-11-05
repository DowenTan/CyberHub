import LegacyPage from '../components/LegacyPage.jsx';
import markup from '../../../CyberHub JS/index.html?raw';
import script from '../../../CyberHub JS/script.js?raw';

export default function LegacyCommandCenter() {
  return <LegacyPage markup={markup} script={script} usesCharts />;
}
