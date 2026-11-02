import React from 'react';

const ACCENTS = {
  professional: '#1d4ed8',
  modern: '#0f172a',
  creative: '#b45309',
  simple: '#374151',
};

const SectionHeading = ({ children, color }) => (
  <div style={{ marginTop: 18 }}>
    <h2
      style={{
        margin: 0,
        fontSize: '11pt',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color,
      }}
    >
      {children}
    </h2>
    <div style={{ borderTop: `1px solid ${color}`, opacity: 0.35, marginTop: 4, marginBottom: 8 }} />
  </div>
);

const dateRange = (start, end, current) =>
  [start, current ? 'Present' : end].filter(Boolean).join(' – ');

// The letter-sized resume as it prints. The inner wrapper keeps a stable id
// because the Word export and the email send read its HTML.
export default function ResumePreview({ resume, participant }) {
  const accent = ACCENTS[resume?.template] || ACCENTS.professional;
  const experience = (resume?.experience || []).filter((e) => e.title || e.company);
  const education = (resume?.education || []).filter((e) => e.institution || e.degree);
  const skills = (resume?.skills || []).filter(Boolean);
  const certifications = (resume?.certifications || []).filter((c) => c.name);
  const contact = [participant?.email, participant?.phone].filter(Boolean).join('  •  ');

  return (
    <div className="jl-resume-page mx-auto shadow-xl" id="jl-resume-page">
      <div id="resume-preview-content" style={{ color: '#111' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20pt', fontWeight: 700, letterSpacing: '0.01em' }}>
            {participant?.name || 'Your Name'}
          </h1>
          {contact && <p style={{ margin: '4px 0 0', fontSize: '10pt' }}>{contact}</p>}
        </div>
        <div style={{ borderTop: `2px solid ${accent}`, marginTop: 10 }} />

        {resume?.summary && (
          <div>
            <SectionHeading color={accent}>Professional Summary</SectionHeading>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{resume.summary}</p>
          </div>
        )}

        {resume?.objective && (
          <div>
            <SectionHeading color={accent}>Objective</SectionHeading>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{resume.objective}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <SectionHeading color={accent}>Work Experience</SectionHeading>
            {experience.map((entry, index) => (
              <div key={index} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong style={{ fontSize: '11pt' }}>{entry.title || 'Role'}</strong>
                  <span style={{ fontSize: '10pt', color: '#4b5563' }}>
                    {dateRange(entry.start_date, entry.end_date, entry.current)}
                  </span>
                </div>
                <p style={{ margin: '1px 0 0', fontSize: '10.5pt', fontStyle: 'italic' }}>{entry.company}</p>
                <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                  {(entry.bullets || []).filter(Boolean).map((bullet, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div>
            <SectionHeading color={accent}>Education</SectionHeading>
            {education.map((entry, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <strong>{entry.degree}{entry.field ? `, ${entry.field}` : ''}</strong>
                  <span style={{ fontSize: '10pt', color: '#4b5563' }}>
                    {dateRange(entry.start_year, entry.end_year, false)}
                  </span>
                </div>
                <p style={{ margin: '1px 0 0', fontSize: '10.5pt' }}>{entry.institution}</p>
                {entry.achievements && <p style={{ margin: '2px 0 0', fontSize: '10pt' }}>{entry.achievements}</p>}
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div>
            <SectionHeading color={accent}>Skills</SectionHeading>
            <p style={{ margin: 0 }}>{skills.join('  •  ')}</p>
          </div>
        )}

        {certifications.length > 0 && (
          <div>
            <SectionHeading color={accent}>Certifications</SectionHeading>
            {certifications.map((cert, index) => (
              <p key={index} style={{ margin: '0 0 2px' }}>
                {[cert.name, cert.issuer, cert.year].filter(Boolean).join(' — ')}
              </p>
            ))}
          </div>
        )}

        {resume?.references_available && (
          <p style={{ marginTop: 22, textAlign: 'center', fontSize: '10pt', fontStyle: 'italic' }}>
            References available upon request
          </p>
        )}
      </div>
    </div>
  );
}