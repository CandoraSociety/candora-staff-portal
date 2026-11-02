import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import RegistrationVerification from "@/components/auth/RegistrationVerification";
import { safeReturnTo } from "@/lib/authReturnTo";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";

// Support older email-prefilled links as a convenience only.
// A query parameter is not an invitation and never grants app access.
const linkEmail = (new URLSearchParams(window.location.search).get("email") || "").trim().toLowerCase();

export default function Register() {
  const [email, setEmail] = useState(linkEmail);
  const [emailLocked, setEmailLocked] = useState(Boolean(linkEmail));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const accountEmail = email.trim().toLowerCase();
      await base44.auth.register({ email: accountEmail, password });
      setRegistrationEmail(accountEmail);
      setVerificationComplete(false);
      setOtpCode("");
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    let emailVerified = verificationComplete;
    try {
      if (!emailVerified) {
        await base44.auth.verifyOtp({ email: registrationEmail, otpCode });
        emailVerified = true;
        setVerificationComplete(true);
      }
      // OTP confirmation is not a login. Establish the session explicitly,
      // including when verification did not return an access token.
      const result = await base44.auth.loginViaEmailPassword(registrationEmail, password);
      if (!result?.access_token) throw new Error("Your email is verified, but sign-in did not finish. Please sign in using your password.");
      window.location.assign(safeReturnTo());
    } catch (err) {
      setError(!emailVerified && /user not found/i.test(err.message || "")
        ? "This code could not be matched to a pending account. If you already verified your email, use Sign in below. Otherwise, start again using the email address you were invited with."
        : err.message || (emailVerified ? "Your email is verified. Please sign in using your password." : "Invalid verification code"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.resendOtp(registrationEmail);
      setOtpCode("");
      toast({ title: "Code sent", description: "Use only the newest code from your email." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <RegistrationVerification
        email={registrationEmail} code={otpCode} onCodeChange={setOtpCode}
        onVerify={handleVerify} onResend={handleResend} loading={loading}
        error={error} verified={verificationComplete}
        onRestart={() => { setShowOtp(false); setOtpCode(""); setError(""); setVerificationComplete(false); }}
      />
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="For staff who have received an app invitation"
      footer={
        <>
          Already have an account?{" "}
          <Link to={`/login?returnTo=${encodeURIComponent(safeReturnTo())}`} className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus={!emailLocked}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={emailLocked}
              className={`pl-10 h-12 ${emailLocked ? "bg-muted text-muted-foreground" : ""}`}
              required
            />
          </div>
          {emailLocked && (
            <p className="text-xs text-muted-foreground">
              This link is set up for your work email.{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => { setEmailLocked(false); setEmail(""); }}
              >
                Use a different email
              </button>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}