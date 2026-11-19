import { createRoot } from 'react-dom/client';
import DashboardApp from './DashboardApp.jsx';

import './styles/style.css';
import './styles/components.css';
import './index.css';

createRoot(document.getElementById('root')).render(<DashboardApp />);
