import jsPDF from 'jspdf';

export function exportBitPdf(client, barrierState, actionPlan, assessorName) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const today = new Date().toLocaleDateString('en-CA');
  const clientName = `${client.first_name} ${client.last_name}`;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Barrier Identification Tool (BIT)', 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Client: ${clientName}`, 20, 30);
  doc.text(`Date: ${today}`, 20, 36);
  doc.text(`Assessor: ${assessorName || 'N/A'}`, 20, 42);

  let y = 52;

  // Confirmed Barriers
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Identified Barriers', 20, y);
  y += 6;
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 6;

  const confirmedEntries = Object.entries(barrierState).filter(([, s]) => s.confirmed === true);

  if (confirmedEntries.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No barriers identified.', 20, y);
    y += 8;
  } else {
    confirmedEntries.forEach(([key, state]) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${key}`, 20, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const challenges = [...state.selectedChallenges, ...state.challengeOthers.filter(Boolean)];
      if (challenges.length > 0) {
        const lines = doc.splitTextToSize(`Challenges: ${challenges.join(', ')}`, 165);
        doc.text(lines, 28, y);
        y += lines.length * 4.5;
      }

      const actions = [...state.selectedActions, ...state.actionOthers.filter(Boolean)];
      if (actions.length > 0) {
        const lines = doc.splitTextToSize(`Recommended Actions: ${actions.join(', ')}`, 165);
        doc.text(lines, 28, y);
        y += lines.length * 4.5;
      }

      if (state.notes) {
        const lines = doc.splitTextToSize(`Notes: ${state.notes}`, 165);
        doc.text(lines, 28, y);
        y += lines.length * 4.5;
      }

      y += 4;
      if (y > 260) { doc.addPage(); y = 20; }
    });
  }

  // Action Plan
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Action Plan Summary', 20, y);
  y += 6;
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (actionPlan.recommendations) {
    const lines = doc.splitTextToSize(`Recommendations:\n${actionPlan.recommendations}`, 165);
    doc.text(lines, 20, y);
    y += lines.length * 4.5 + 2;
  }

  if (actionPlan.checkin_frequency) {
    doc.text(`Check-in Frequency: ${actionPlan.checkin_frequency}`, 20, y);
    y += 5;
  }

  if (actionPlan.followup_methods?.length > 0) {
    doc.text(`Follow-up Methods: ${actionPlan.followup_methods.join(', ')}`, 20, y);
    y += 5;
  }

  const reviewDates = actionPlan.review_dates?.filter(Boolean);
  if (reviewDates?.length > 0) {
    doc.text(`Scheduled Review Dates: ${reviewDates.join(', ')}`, 20, y);
    y += 5;
  }

  if (actionPlan.progress) {
    doc.text(`Progress: ${actionPlan.progress}`, 20, y);
    y += 5;
  }

  if (actionPlan.additional_notes) {
    const lines = doc.splitTextToSize(`Additional Notes: ${actionPlan.additional_notes}`, 165);
    doc.text(lines, 20, y);
    y += lines.length * 4.5;
  }

  doc.save(`BIT_${clientName.replace(/\s+/g, '_')}_${today}.pdf`);
}