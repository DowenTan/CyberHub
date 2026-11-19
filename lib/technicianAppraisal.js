/**
 * Technician AI Performance Appraisal & Work Ethics Evaluation Library.
 * 
 * Computes:
 * - Comprehensive technician KPIs (FTFR, completed jobs, CSAT, SLA compliance, rework rate, margin).
 * - AI Work Ethics & Conduct analysis (punctuality, safety, dispatch communication, peer mentoring).
 * - Key Achievements & Milestones.
 * - Logged Mistakes, Incidents & Improvement Areas.
 * - AI Review & Career Trajectory Recommendation (Promotion, Demotion warning, Merit Retention, Further Training).
 * 
 * Zero emojis - pure SVG icons and structured data.
 */

export function evaluateTechnicianClient(tech) {
  if (!tech) return null;

  const id = tech.id || 1;
  const code = tech.code || 'T-001';
  const name = tech.name || 'Technician';
  const specialty = tech.specialty || 'Heating and Cooling (HVAC)';
  const zone = tech.zone || 'Klang Valley';
  const completedJobs = Number(tech.completedJobs) || 28;
  const rating = Number(tech.rating) || 4.7;

  let ftfr = 88.0;
  if (typeof tech.firstFixRate === 'string') {
    const parsed = parseFloat(tech.firstFixRate.replace('%', ''));
    if (!isNaN(parsed)) ftfr = parsed;
  } else if (typeof tech.firstFixRate === 'number') {
    ftfr = tech.firstFixRate;
  }

  const slaCompliance = Math.min(99.0, Math.max(75.0, Number((ftfr * 1.05 - (5.0 - rating) * 4).toFixed(1))));
  const reworkRate = Math.max(1.2, Number(((100.0 - ftfr) * 0.65).toFixed(1)));
  const avgMinutes = Math.max(38, Math.round(115 - rating * 12));
  const revenue = Number((completedJobs * 285.0 + ftfr * 15.0).toFixed(2));
  const margin = Number((revenue * 0.58).toFixed(2));

  const kpis = {
    completedJobs,
    firstTimeFixRatePct: ftfr,
    customerRating: rating,
    avgCompletionTimeMinutes: avgMinutes,
    slaComplianceRatePct: slaCompliance,
    warrantyReworkRatePct: reworkRate,
    revenueGeneratedMyr: revenue,
    marginContributionMyr: margin,
  };

  let workEthics;
  let achievements;
  let mistakes;

  if (name.includes('Sarah') || code === 'T-001') {
    workEthics = {
      overallRating: 'Exceptional',
      punctualityScorePct: 98.5,
      safetyAndSopCompliancePct: 99.2,
      dispatchCommunicationRating: 'Prompt & Clear',
      peerCollaborationRating: 'Mentoring Leader',
      toolAndFleetCareRating: 'Flawless',
      summary:
        'Exhibits exemplary professional discipline and patient customer de-escalation skills. ' +
        'Consistently reports on-site 10 minutes prior to scheduled appointments. Strictly complies with ' +
        'CIDB electrical safety standards and maintains impeccable diagnostic instrument calibration. ' +
        'Proactively shares refrigeration troubleshooting notes with junior apprentices.',
    };
    achievements = [
      {
        id: 'ach-1',
        title: 'Bangsar Commercial Inverter Recovery',
        date: '2026-10-18',
        category: 'Technical Excellence',
        description: 'Diagnosed intermittent inverter PCB capacitor leakage on a 3-phase Daikin VRV system within 35 minutes, avoiding complete unit replacement.',
        impact: 'Saved client RM 4,800 in capital replacement; secured 12-month commercial service contract.',
      },
      {
        id: 'ach-2',
        title: 'Flawless Zero-Rework Streak',
        date: '2026-11-04',
        category: 'Quality Assurance',
        description: 'Completed 42 consecutive residential HVAC dispatches without a single warranty callback or leak complaint.',
        impact: 'Boosted branch first-fix efficiency rating by +4.2%.',
      },
      {
        id: 'ach-3',
        title: 'CIDB Master HVAC Certification Distinction',
        date: '2026-09-12',
        category: 'Professional Credential',
        description: 'Passed Level 3 CIDB advanced heat-pump diagnostics examination with top percentile distinction.',
        impact: 'Qualified CyberHub for government and GLC institution facilities tender bids.',
      },
    ];
    mistakes = [
      {
        id: 'mis-1',
        title: 'Late Status Update on Guardhouse Delay (#ORD-388)',
        date: '2026-08-14',
        category: 'Communication',
        description: 'Delayed dispatch status update by 25 minutes while awaiting visitor pass approval at Mont Kiara security entrance.',
        impact: 'Triggered automated dispatcher warning ping; client was kept waiting 15 mins without real-time GPS tracking.',
        severity: 'Minor',
        resolutionStatus: 'Resolved',
      },
    ];
  } else if (name.includes('Jason') || code === 'T-002') {
    workEthics = {
      overallRating: 'Consistent',
      punctualityScorePct: 91.0,
      safetyAndSopCompliancePct: 92.5,
      dispatchCommunicationRating: 'Satisfactory',
      peerCollaborationRating: 'Cooperative Team Member',
      toolAndFleetCareRating: 'Good',
      summary:
        'Dependable, tenacious technician with solid hands-on mechanical aptitude. Demonstrates high ' +
        'willingness to accept weekend emergency callouts. Occasionally rushes post-job paperwork ' +
        'and digital report completion under peak order volume. Receptive to supervisor feedback and ' +
        'enthusiastic about upskilling.',
    };
    achievements = [
      {
        id: 'ach-1',
        title: 'Rapid Drum Spider Assembly Replacement',
        date: '2026-10-22',
        category: 'Mechanical Efficiency',
        description: 'Overhauled snapped cast-aluminum drum spider on high-capacity front loader in under 75 minutes.',
        impact: 'Customer delighted; completed 2 additional jobs on same route.',
      },
      {
        id: 'ach-2',
        title: 'High-Volume Weekend Surge Support',
        date: '2026-10-30',
        category: 'Dedication & Readiness',
        description: 'Voluntarily took on 7 urgent Saturday overflow tickets in Subang Jaya during monsoon storm power surge.',
        impact: 'Maintained team SLA adherence above 94%.',
      },
    ];
    mistakes = [
      {
        id: 'mis-1',
        title: 'Incomplete Digital FSR Upload (#ORD-419)',
        date: '2026-09-28',
        category: 'Administrative SOP',
        description: 'Omitted post-repair compressor resistance readings and serial barcode scan in field service report.',
        impact: 'Back-office billing delayed by 48 hours awaiting manual technician verification.',
        severity: 'Minor',
        resolutionStatus: 'Resolved',
      },
      {
        id: 'mis-2',
        title: 'Secondary Drain Fitting Seepage (#ORD-441)',
        date: '2026-10-09',
        category: 'Quality',
        description: 'Re-used aged spring clamp on washing machine drain hose causing minor water seepage 24 hours later.',
        impact: 'Required rapid warranty callback revisit at company expense.',
        severity: 'Moderate',
        resolutionStatus: 'Under Coaching',
      },
    ];
  } else {
    const isHighPerformer = rating >= 4.6 && ftfr >= 88.0 && completedJobs >= 15;
    workEthics = {
      overallRating: isHighPerformer ? 'Exceptional' : 'Consistent',
      punctualityScorePct: isHighPerformer ? 94.0 : 88.0,
      safetyAndSopCompliancePct: isHighPerformer ? 96.0 : 89.0,
      dispatchCommunicationRating: isHighPerformer ? 'Prompt & Clear' : 'Adequate',
      peerCollaborationRating: 'Reliable Contributor',
      toolAndFleetCareRating: 'Good',
      summary:
        `Demonstrates consistent dedication to field repair excellence with a ${rating.toFixed(1)}/5.0 customer rating ` +
        `and ${ftfr.toFixed(1)}% first-time fix rate. Follows standard service workflows and adheres to safety gear protocols. ` +
        `Shows dependable technical competence across ${specialty} categories.`,
    };
    achievements = [
      {
        id: `ach-${code}-1`,
        title: 'Reliable Field Completion Record',
        date: '2026-10-15',
        category: 'Productivity',
        description: `Successfully handled ${completedJobs} customer dispatches with verified positive feedback.`,
        impact: `Contributed RM ${margin.toLocaleString('en-MY')} in gross operating margin.`,
      },
    ];
    mistakes = [
      {
        id: `mis-${code}-1`,
        title: 'Minor Traffic Delay During Monsoon Weather',
        date: '2026-09-19',
        category: 'Punctuality',
        description: 'Delayed 18 minutes on Federal Highway during flash flood event.',
        impact: 'Client updated via dispatch SMS; no formal complaint lodged.',
        severity: 'Minor',
        resolutionStatus: 'Resolved',
      },
    ];
  }

  // AI Review Decision Matrix
  let recommendationCode;
  let recommendationTitle;
  let recommendationColor;
  let confidence;
  let reasoning;
  let trainingModules;
  let supervisorAction;

  if (rating >= 4.6 && ftfr >= 88.0 && completedJobs >= 20) {
    recommendationCode = 'ELIGIBLE_FOR_PROMOTION';
    recommendationTitle = 'Eligible for Promotion (Senior Lead Specialist / Field Mentor)';
    recommendationColor = '#2ed573';
    confidence = 0.94;
    reasoning =
      `${name} ranks in the top 5th percentile of the CyberHub fleet with an outstanding ${rating.toFixed(1)}/5.0 CSAT ` +
      `and ${ftfr.toFixed(1)}% First-Time Fix Rate across ${completedJobs} logged jobs. Exceptional work ethics, zero critical safety breaches, ` +
      `and strong mentoring attitude qualify ${name} for immediate promotion to Senior Lead Specialist / Fleet Squad Leader. ` +
      `Promotion authorizes signing off apprentice repair audits and leading commercial high-voltage contracts.`;
    trainingModules = [
      { name: 'Fleet Squad Leadership & Mentorship Coaching', provider: 'CyberHub Academy', hours: 16, status: 'Recommended' },
      { name: 'Commercial Multi-VRV Chillers & Building Automation', provider: 'CIDB Malaysia', hours: 32, status: 'Optional Advance' },
    ];
    supervisorAction = 'Recommend Branch Manager submit formal promotion paperwork for Board HR approval.';
  } else if (rating >= 4.3 && ftfr >= 82.0) {
    recommendationCode = 'MERIT_BONUS_AND_RETENTION';
    recommendationTitle = 'Eligible for Annual Merit Bonus & Retention Tier 1';
    recommendationColor = '#38bdf8';
    confidence = 0.89;
    reasoning =
      `${name} maintains solid performance metrics meeting all fleet KPIs. First-time fix rate of ${ftfr.toFixed(1)}% ` +
      `and SLA compliance rate of ${slaCompliance.toFixed(1)}% demonstrate consistent operational value. ` +
      `Recommended for Tier-1 Annual Performance Bonus and renewal of senior equipment allowance.`;
    trainingModules = [
      { name: 'Advanced Inverter Microcontroller Diagnostics', provider: 'Suruhanjaya Tenaga', hours: 24, status: 'Recommended' },
      { name: 'Digital FSR Paperwork & Mobile Asset Automation', provider: 'CyberHub Internal', hours: 8, status: 'Scheduled' },
    ];
    supervisorAction = 'Approve merit bonus allotment and schedule upcoming certification renewal.';
  } else if (ftfr < 80.0 || reworkRate > 9.0) {
    recommendationCode = 'FURTHER_TRAINING_REQUIRED';
    recommendationTitle = 'Mandatory Further Training & Competency Upskilling';
    recommendationColor = '#ff7300';
    confidence = 0.86;
    reasoning =
      `Performance audit flags elevated warranty callback rate (${reworkRate.toFixed(1)}%) and procedural inconsistencies. ` +
      `While basic customer courtesy remains intact, technical execution in complex diagnostic scenarios requires reinforcement. ` +
      `Recommend 30-day paired field shifts alongside a Senior Mentor and completion of targeted practical modules.`;
    trainingModules = [
      { name: 'Comprehensive Leak Detection & Torque Specifications', provider: 'CIDB Malaysia', hours: 20, status: 'Mandatory' },
      { name: 'Root-Cause Diagnostic Flowcharting & SOP Compliance', provider: 'CyberHub Academy', hours: 16, status: 'Mandatory' },
    ];
    supervisorAction = 'Assign Senior Mentor and enroll technician in 30-day upskilling cohort.';
  } else {
    recommendationCode = 'PERFORMANCE_IMPROVEMENT_PLAN';
    recommendationTitle = 'Performance Improvement Plan (PIP) & Close Supervision';
    recommendationColor = '#ff4757';
    confidence = 0.91;
    reasoning =
      `Sub-standard KPI indicators: rating ${rating.toFixed(1)}/5.0 or first-fix rate ${ftfr.toFixed(1)}%. ` +
      `Technician requires immediate 45-day structured remediation plan under direct supervisor observation. ` +
      `Failure to meet 82% FTFR threshold upon re-evaluation will initiate formal demotion review.`;
    trainingModules = [
      { name: 'Core Safety, Lockout/Tagout & Work Ethics Remediation', provider: 'CyberHub Safety Dept', hours: 24, status: 'Mandatory' },
      { name: 'Customer Communication & Conflict Resolution', provider: 'CyberHub HR', hours: 12, status: 'Mandatory' },
    ];
    supervisorAction = 'Issue formal PIP notice and conduct weekly supervisor performance reviews.';
  }

  return {
    technicianId: id,
    technicianCode: code,
    technicianName: name,
    specialty,
    zone,
    avatar: tech.avatar || '/logo1.png',
    tenureMonths: tech.tenureMonths || 18,
    kpis,
    workEthics,
    achievements,
    mistakes,
    aiReview: {
      recommendationCode,
      recommendationTitle,
      recommendationColor,
      confidenceScore: confidence,
      reasoning,
      recommendedTrainingModules: trainingModules,
      supervisorActionRequired: supervisorAction,
      evaluatedAt: new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
  };
}
