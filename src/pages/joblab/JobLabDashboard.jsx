import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ClipboardList, FileText, Route, BookOpen, Briefcase, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import { JLBadge, JLCard } from '@/components/joblab/ui';

const ACTIONS = [
  { to: '/joblab/job-search', label: 'Search Jobs', description: 'Find jobs tailored to your skills', icon: Search, tint: 'bg-jl-primary/10 text-jl-primary' },
  { to: '/joblab/job-tracker', label: 'Track Applications', description: 'Monitor your job applications', icon: ClipboardList, tint: 'bg-jl-success/10 text-jl-success' },
  { to: '/joblab/resume-builder', label: 'Build Resume', description: 'Create a professional resume', icon: FileText, tint: 'bg-jl-accent/10 text-jl-accent' },
  { to: '/joblab/career-path', label: 'Career Path', description: 'Map your career trajectory', icon: Route, tint: 'bg-jl-purple/10 text-jl-purple' },
  { to: '/joblab/resources', label: 'Resources', description: 'Training, guides & more', icon: BookOpen, tint: 'bg-jl-pink/10 text-jl-pink' },
  { to: '/joblab/profile', label: 'My Profile', description: 'Update skills & experience', icon: Briefcase, tint: 'bg-jl-primary/10 text-jl-primary' },
];

const JOB_SITES = [
  { name: 'ALIS Alberta', url: 'https://alis.alberta.ca', description: 'Career planning and job search tools for Albertans.' },
  { name: 'Job Bank Canada', url: 'https://www.jobbank.gc.ca', description: 'The Government of Canada job board.' },
  { name: 'Indeed Canada', url: 'https://ca.indeed.com', description: 'Millions of postings from across the country.' },
  { name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs', description: 'Professional roles and networking.' },
];

const INSIGHTS = [
  { name: 'Alberta Job Trends', url: 'https://alis.alberta.ca/look-for-work/', tint: 'bg-jl-primary/5', icon: 'text-jl-primary' },
  { name: 'Occupational Profiles', url: 'https://alis.alberta.ca/explore-careers/', tint: 'bg-jl-success/5', icon: 'text-jl-success' },
  { name: 'Wage & Outlook Data', url: 'https://www.jobbank.gc.ca/trend-analysis', tint: 'bg-jl-accent/5', icon: 'text-jl-accent' },
];

export default function JobLabDashboard() {
  const { participant, isGuest } = useParticipant();
  const firstName = (participant?.name || '').split(' ')[0];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="jl-heading text-2xl font-bold text-jl-fg sm:text-3xl">
            Welcome{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-jl-muted-fg">
            Here's your career command centre. What would you like to work on today?
          </p>
        </div>
        {isGuest && (
          <JLBadge className="border border-jl-accent/40 bg-white px-3 py-1 text-jl-accent">
            <AlertTriangle className="h-3 w-3" /> Guest Session — work not saved
          </JLBadge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map(({ to, label, description, icon: Icon, tint }, index) => (
          <motion.div
            key={to}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <Link to={to} className="block h-full">
              <JLCard className="h-full p-5 transition-shadow hover:shadow-md">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="jl-heading text-sm font-semibold text-jl-fg">{label}</p>
                <p className="mt-0.5 text-xs text-jl-muted-fg">{description}</p>
              </JLCard>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="jl-heading mb-3 text-lg font-semibold text-jl-fg">Quick Links &amp; Job Sites</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {JOB_SITES.map((site) => (
            <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer">
              <JLCard className="h-full p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-jl-fg">{site.name}</p>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-jl-muted-fg" />
                </div>
                <p className="mt-1 text-xs text-jl-muted-fg">{site.description}</p>
              </JLCard>
            </a>
          ))}
        </div>
      </div>

      <JLCard className="mt-8 p-5">
        <h2 className="jl-heading mb-3 text-lg font-semibold text-jl-fg">Labour Market Insights</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {INSIGHTS.map((item) => (
            <a
              key={item.name}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between rounded-lg ${item.tint} px-4 py-3 transition-colors hover:brightness-[0.98]`}
            >
              <span className={`text-sm font-medium ${item.icon}`}>{item.name}</span>
              <ExternalLink className={`h-3.5 w-3.5 ${item.icon}`} />
            </a>
          ))}
        </div>
      </JLCard>
    </div>
  );
}