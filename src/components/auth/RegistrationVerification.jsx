import { Link } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function RegistrationVerification({ email, code, onCodeChange, onVerify, onResend, onRestart, loading, error, verified }) {
  return (
    <AuthLayout icon={Mail} title={verified ? 'Email verified' : 'Verify your email'} subtitle={verified ? 'Your email is confirmed. Sign in to finish.' : `Enter the newest 6-digit code sent to ${email}`} footer={<Link to="/login" className="text-primary font-medium hover:underline">Already verified? Sign in</Link>}>
      {error && <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
      <form onSubmit={onVerify} className="space-y-6">
        {!verified && <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={onCodeChange} disabled={loading} autoFocus autoComplete="one-time-code" aria-label="Email verification code">
            <InputOTPGroup>{[0, 1, 2, 3, 4, 5].map(index => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup>
          </InputOTP>
        </div>}
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || (!verified && code.length !== 6)}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{verified ? 'Signing in...' : 'Verifying...'}</> : verified ? 'Sign in' : 'Verify and sign in'}
        </Button>
      </form>
      {!verified && <div className="mt-4 space-y-3 text-center text-sm text-muted-foreground">
        <p>Didn't receive the code? <button type="button" disabled={loading} onClick={onResend} className="text-primary font-medium hover:underline disabled:opacity-50">Resend</button></p>
        <button type="button" disabled={loading} onClick={onRestart} className="hover:underline disabled:opacity-50">Use a different email or start again</button>
      </div>}
    </AuthLayout>
  );
}