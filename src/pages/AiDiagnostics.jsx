import { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore.js';

const AiDiagnostics = () => {
  const { diagnosticsLogs, addDiagnosticLog } = useDashboardStore();
  const [appliance, setAppliance] = useState('Panasonic 2.0HP Inverter AC');
  const [symptoms, setSymptoms] = useState('');

  const handleSimulateAssessment = (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    const isWasher = appliance.toLowerCase().includes('wash');
    const newLog = {
      id: `DIAG-${Math.floor(404 + Math.random() * 90)}`,
      timestamp: 'Just now',
      appliance,
      symptoms,
      predictedFault: isWasher
        ? 'Drain Impeller Obstruction / Hall Sensor Fault'
        : 'Outdoor Condenser Relay / Refrigerant Low Pressure',
      confidence: Math.floor(88 + Math.random() * 10),
      recommendedPart: isWasher ? 'PRT-045' : 'PRT-001',
      estCost: isWasher ? 'RM 135 - RM 170' : 'RM 165 - RM 220',
    };

    addDiagnosticLog(newLog);
    setSymptoms('');
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1>AI Diagnostics Engine</h1>
          <p className="subtitle">Automated symptom-to-fault classification and spare part matching.</p>
        </div>
      </div>

      <div className="two-col-grid">
        <div className="ch-card">
          <h3>Simulate AI Fault Assessment</h3>
          <form onSubmit={handleSimulateAssessment} className="stack-list" style={{ marginTop: '14px' }}>
            <div>
              <label className="kpi-label">Appliance Model</label>
              <input
                className="ch-input"
                value={appliance}
                onChange={(e) => setAppliance(e.target.value)}
              />
            </div>
            <div>
              <label className="kpi-label">Customer Reported Symptoms / Error Codes</label>
              <textarea
                className="ch-input"
                rows="3"
                placeholder="e.g., Blinking H11 error code, indoor unit blowing warm air..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">
              Run AI Assessment
            </button>
          </form>
        </div>

        <div className="ch-card">
          <h3>Recent AI Diagnostic Stream</h3>
          <div className="stack-list" style={{ marginTop: '14px' }}>
            {diagnosticsLogs.map((log) => (
              <div key={log.id} className="list-item-box">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="accent-text mono">{log.id}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{log.timestamp}</span>
                </div>
                <h4 style={{ margin: '6px 0 2px 0' }}>{log.appliance}</h4>
                <p style={{ margin: '2px 0 8px 0', fontSize: '12px', color: '#9ca3af' }}>
                  &ldquo;{log.symptoms}&rdquo;
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>
                    <strong>Fault:</strong> {log.predictedFault} ({log.recommendedPart})
                  </span>
                  <span className="green-text">{log.confidence}% Match</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDiagnostics;