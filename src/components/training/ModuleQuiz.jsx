import { useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, RotateCcw, XCircle } from 'lucide-react';

// A module's end-of-training quiz. One question at a time, checked as you go
// (with an explanation either way), then a score. PASS_MARK decides whether
// the module's quiz requirement is met.
export const PASS_MARK = 75;

const optionStyle = (state) => {
  if (state === 'correct') return { background: 'hsl(152, 45%, 18%)', borderColor: 'hsl(152, 45%, 38%)', color: 'hsl(152, 55%, 82%)' };
  if (state === 'wrong') return { background: 'hsl(0, 40%, 20%)', borderColor: 'hsl(0, 45%, 42%)', color: 'hsl(0, 50%, 86%)' };
  if (state === 'chosen') return { background: 'hsl(45, 30%, 16%)', borderColor: 'hsl(45, 70%, 48%)', color: 'hsl(45, 60%, 88%)' };
  return { background: 'hsl(230, 60%, 13%)', borderColor: 'hsl(230, 45%, 22%)', color: 'hsl(45, 40%, 88%)' };
};

export default function ModuleQuiz({ quiz, onComplete }) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  if (!quiz?.length) return null;
  const question = quiz[index];
  const correctCount = answers.filter(a => a.correct).length;
  const score = Math.round((correctCount / quiz.length) * 100);
  const passed = score >= PASS_MARK;

  const check = () => {
    if (choice == null) return;
    setAnswers([...answers, { at: index, choice, correct: choice === question.answer }]);
    setChecked(true);
  };

  const next = () => {
    if (index < quiz.length - 1) {
      setIndex(index + 1);
      setChoice(null);
      setChecked(false);
      return;
    }
    const result = Math.round((answers.filter(a => a.correct).length / quiz.length) * 100);
    setFinished(true);
    onComplete?.({ score: result, passed: result >= PASS_MARK, answers });
  };

  const retake = () => {
    setIndex(0);
    setChoice(null);
    setChecked(false);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const missed = answers.filter(a => !a.correct);
    return (
      <div className="space-y-3">
        <div className="rounded-xl px-4 py-5 text-center" style={{ background: 'hsl(230, 60%, 13%)', border: `1px solid ${passed ? 'hsl(152, 45%, 34%)' : 'hsl(45, 60%, 32%)'}` }}>
          <p className="text-3xl font-bold" style={{ color: passed ? 'hsl(152, 55%, 70%)' : 'hsl(45, 92%, 60%)' }}>{score}%</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: 'hsl(45, 50%, 90%)' }}>
            {correctCount} of {quiz.length} correct
          </p>
          <p className="mt-1 text-xs" style={{ color: 'hsl(230, 25%, 65%)' }}>
            {passed ? 'Quiz passed — well done.' : `You need ${PASS_MARK}% to pass. Review the recap and try again.`}
          </p>
        </div>

        {missed.length > 0 && (
          <div className="rounded-xl px-3 py-2.5" style={{ background: 'hsl(230, 60%, 13%)', border: '1px solid hsl(230, 45%, 22%)' }}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'hsl(45, 92%, 65%)' }}>Worth another look</p>
            <ul className="space-y-1.5">
              {missed.map(a => (
                <li key={a.at} className="text-[11px] leading-snug" style={{ color: 'hsl(45, 40%, 88%)' }}>
                  <span className="font-semibold">{quiz[a.at].question}</span>
                  <br />
                  <span style={{ color: 'hsl(152, 50%, 72%)' }}>{quiz[a.at].options[quiz[a.at].answer]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={retake}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors hover:opacity-80"
          style={{ background: 'hsl(230, 55%, 20%)', color: 'hsl(45, 60%, 85%)' }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'hsl(45, 92%, 65%)' }}>
          Question {index + 1} of {quiz.length}
        </p>
        {answers.length > 0 && (
          <p className="text-[11px]" style={{ color: 'hsl(230, 25%, 60%)' }}>{correctCount} correct so far</p>
        )}
      </div>

      <p className="text-sm font-semibold leading-snug" style={{ color: 'hsl(45, 50%, 92%)' }}>{question.question}</p>

      <div className="space-y-1.5">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer;
          const state = checked
            ? isAnswer ? 'correct' : i === choice ? 'wrong' : null
            : i === choice ? 'chosen' : null;
          const Icon = checked && isAnswer ? CheckCircle2 : checked && i === choice ? XCircle : Circle;
          return (
            <button
              key={option}
              onClick={() => { if (!checked) setChoice(i); }}
              disabled={checked}
              className="flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs leading-snug transition-colors disabled:cursor-default"
              style={optionStyle(state)}
            >
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{option}</span>
            </button>
          );
        })}
      </div>

      {checked && (
        <p
          className="rounded-lg px-2.5 py-2 text-[11px] leading-snug"
          style={{
            background: choice === question.answer ? 'hsl(152, 40%, 14%)' : 'hsl(0, 35%, 16%)',
            border: `1px solid ${choice === question.answer ? 'hsl(152, 45%, 30%)' : 'hsl(0, 40%, 34%)'}`,
            color: choice === question.answer ? 'hsl(152, 50%, 82%)' : 'hsl(0, 45%, 84%)',
          }}
        >
          {choice === question.answer ? 'Correct. ' : 'Not quite. '}
          {question.explain}
        </p>
      )}

      <div className="flex justify-end">
        {checked ? (
          <button
            onClick={next}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors hover:opacity-80"
            style={{ background: 'hsl(45, 92%, 53%)', color: 'hsl(230, 70%, 10%)' }}
          >
            {index < quiz.length - 1 ? 'Next question' : 'See result'} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={check}
            disabled={choice == null}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors hover:opacity-80 disabled:opacity-40"
            style={{ background: 'hsl(45, 92%, 53%)', color: 'hsl(230, 70%, 10%)' }}
          >
            Check answer
          </button>
        )}
      </div>
    </div>
  );
}