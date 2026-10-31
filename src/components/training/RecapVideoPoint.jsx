import { motion } from 'framer-motion';

export default function RecapVideoPoint({ text, index, active, tone }) {
  const split = text.indexOf(': ');
  const heading = split < 0 ? text : text.slice(0, split);
  const detail = split < 0 ? '' : text.slice(split + 2);
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${active ? tone.active : 'border-transparent bg-sidebar-accent/40'}`}
      aria-current={active ? 'step' : undefined}
    >
      <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${tone.dot}`} aria-hidden="true" />
      <div className="min-w-0">
        <strong className={`block text-base leading-snug ${active ? tone.text : 'text-sidebar-foreground'}`}>{heading}</strong>
        {detail && <span className="mt-0.5 block text-sm leading-relaxed text-sidebar-foreground/85">{detail}</span>}
      </div>
    </motion.li>
  );
}