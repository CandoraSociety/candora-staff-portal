import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ClipboardList, FileText, Route, BookOpen, UserRound, AlertTriangle, ArrowRight, LifeBuoy, LogOut,
} from 'lucide-react';
import { useParticipant } from '@/lib/joblab/ParticipantContext';
import { JLBadge } from '@/components/joblab/ui';
import { CandoraMark } from '@/components/joblab/JobLabBrand';
import FollowUpNudges from '@/components/joblab/FollowUpNudges';

const START = [
  {
    to: '/joblab/job-search',
    title: 'Find a job',
    text: 'Search openings and see which ones fit your skills.',
    icon: Search,
  },
  {
    to: '/joblab/resume-builder',
    title: 'Get your resume ready',
    text: 'Build a resume you can print, save or email to an employer.',
    icon: FileText,
  },
  {
    to: '/joblab/career-path',
    title: 'Plan your next step',
    text: 'Map out the training and experience to get where you want to go.',
    icon: Route,
  },
];

const KEEP_GOING = [
  { to: '/joblab/job-tracker', title: 'My applications', text: 'Everything you have saved or applied for.', icon: ClipboardList },
  { to: '/joblab/resources', title: 'Learn & resources', text: 'Free guides, job boards and workshops.', icon: BookOpen },
  { to: '/joblab/profile', title: 'My profile & skills', text: 'Keep your details up to date.', icon: UserRound },
];

const STEPS = [
  { title: 'Find work that fits', text: 'Search jobs or look up a career you are curious about.' },
  { title: 'Save the ones you like', text: 'Keep a shortlist and track where each application stands.' },
  { title: 'Apply with your resume', text: 'Build it here, then email or print it when you are ready.' },
];

export default function JobLabDashboard() {
  const { participant, isGuest, logout } = useParticipant();
  const navigate = useNavigate();
  const firstName = (participant?.name || '').split(' ')[0];

  const finishSession = () => {
    logout();
    navigate('/joblab', { replace: true });
  };

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-jl-navy px-5 py-6 sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-jl-gold/15 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <CandoraMark className="h-11 w-11 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-jl-gold">Candora Job Lab</p>
              <h1 className="jl-heading mt-1 text-2xl font-bold text-white sm:text-3xl">
                Welcome{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-jl-navy-fg/75">
                Take your time and start wherever you like — nothing here is a test, and you can come back to it any
                time.
              </p>
            </div>
          </div>
          {isGuest && (
            <JLBadge className="border border-jl-accent/40 bg-jl-accent/10 px-3 py-1 text-jl-accent">
              <AlertTriangle className="h-3 w-3" /> Guest session — work not saved
            </JLBadge>
          )}
        </div>

        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <Link
            to="/joblab/job-search"
            className="inline-flex items-center gap-2 rounded-lg bg-jl-gold px-4 py-2.5 text-sm font-semibold text-jl-navy shadow-sm transition-colors hover:bg-jl-gold/90"
          >
            <Search className="h-4 w-4" /> Start a job search
          </Link>
          <Link
            to="/joblab/job-tracker"
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm font-medium text-jl-navy-fg transition-colors hover:bg-white/10"
          >
            See my applications
          </Link>
        </div>
      </section>

      <FollowUpNudges />

      {/* How it works */}
      <section>
        <h2 className="jl-heading mb-3 text-base font-semibold text-jl-fg">How Job Lab works</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-jl-border bg-white p-4">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-jl-gold/25 text-xs font-bold text-jl-navy">
                {index + 1}
              </span>
              <p className="mt-2.5 text-sm font-semibold text-jl-fg">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-jl-muted-fg">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Start here */}
      <section>
        <h2 className="jl-heading mb-3 text-base font-semibold text-jl-fg">Start here</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {START.map(({ to, title, text, icon: Icon }, index) => (
            <motion.div
              key={to}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link to={to} className="group block h-full">
                <div className="flex h-full flex-col rounded-2xl border border-jl-border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-jl-gold/60 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-jl-navy text-jl-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="jl-heading mt-3 text-base font-semibold text-jl-fg">{title}</p>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-jl-muted-fg">{text}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-jl-primary">
                    Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Keep going */}
      <section>
        <h2 className="jl-heading mb-3 text-base font-semibold text-jl-fg">Keep going</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {KEEP_GOING.map(({ to, title, text, icon: Icon }) => (
            <Link key={to} to={to} className="group block h-full">
              <div className="flex h-full items-start gap-3 rounded-xl border border-jl-border bg-white p-4 transition-colors hover:border-jl-gold/60 hover:bg-jl-gold/5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-jl-secondary text-jl-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-jl-fg">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-jl-muted-fg">{text}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-jl-border bg-white p-4">
        <div>
          <p className="jl-heading text-sm font-semibold text-jl-fg">Finished for today?</p>
          <p className="mt-0.5 text-xs text-jl-muted-fg">
            Sign out so the next person has a private session. Anything you saved stays on your account.
          </p>
        </div>
        <button
          onClick={finishSession}
          className="inline-flex items-center gap-2 rounded-lg bg-jl-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jl-navy/90"
        >
          <LogOut className="h-4 w-4" /> Finish &amp; sign out
        </button>
      </section>

      <div className="flex items-start gap-2.5 rounded-xl bg-jl-navy/[0.04] px-4 py-3">
        <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-jl-primary" />
        <p className="text-xs leading-relaxed text-jl-muted-fg">
          Stuck or not sure where to start? Ask the staff at the front desk — someone can sit with you and walk through
          it together.
        </p>
      </div>
    </div>
  );
}