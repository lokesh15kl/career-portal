import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, sendOtp, testBackend, verifyOtp } from "../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const checkBackend = async () => {
    setChecking(true);
    try {
      await testBackend();
      setBackendReady(true);
    } catch {
      setBackendReady(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSendOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await sendOtp(form);
      setStep("otp");
      setMessage("OTP sent to your email. Enter it below.");
    } catch (sendError) {
      const errorText = String(sendError?.message || "");
      const smtpUnavailable = /failed to send otp email|smtp|app password/i.test(errorText);

      if (smtpUnavailable) {
        try {
          await registerUser({ ...form, role: "USER" });
          setMessage("Signup completed. Email OTP is temporarily unavailable, so your account was created directly.");
          setTimeout(() => navigate("/login"), 1200);
          return;
        } catch (registerError) {
          setError(registerError?.message || "Unable to create account");
          return;
        }
      }

      setError(errorText || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const responseText = await verifyOtp(otp);

      if (typeof responseText === "string" && responseText.includes("Invalid OTP")) {
        setError("Invalid OTP. Please try again.");
        return;
      }

      setMessage("Signup complete. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (verifyError) {
      setError(verifyError.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-neo-shell">
      <div className="auth-neo-card auth-neo-card--signup">
        <section className="auth-neo-info-panel">
          <h1 className="auth-neo-welcome auth-neo-anim" style={{ "--li": 2 }}>WELCOME!</h1>
          <p className="auth-neo-copy auth-neo-anim" style={{ "--li": 3 }}>
            We&apos;re delighted to have you here. If you need any assistance, feel free to reach out.
          </p>
          <div className="auth-neo-anim" style={{ "--li": 4 }}>
            <Link to="/" className="auth-neo-link">Back to Home</Link>
          </div>
        </section>

        <section className="auth-neo-form-panel">
          <div className="auth-neo-title auth-neo-anim" style={{ "--li": 1 }}>
            {step === "signup" ? "Register" : "Verify OTP"}
          </div>

          <div className="auth-neo-health auth-neo-anim" style={{ "--li": 2 }}>
          {checking
            ? "Checking backend..."
            : backendReady
              ? "Backend connected"
              : "Backend offline. Please try again."}
        </div>

        {step === "signup" ? (
          <form onSubmit={onSendOtp} className="auth-neo-form">
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={onChange}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 3 }}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={onChange}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 4 }}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 5 }}
              required
            />

            {error ? <p className="auth-neo-error auth-neo-anim" style={{ "--li": 6 }}>{error}</p> : null}
            {message ? <p className="auth-neo-success auth-neo-anim" style={{ "--li": 7 }}>{message}</p> : null}

            <button
              type="submit"
              className="auth-neo-primary-btn auth-neo-anim"
              style={{ "--li": 8 }}
              disabled={loading || !backendReady}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="auth-neo-form">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 3 }}
              required
            />

            {error ? <p className="auth-neo-error auth-neo-anim" style={{ "--li": 4 }}>{error}</p> : null}
            {message ? <p className="auth-neo-success auth-neo-anim" style={{ "--li": 5 }}>{message}</p> : null}

            <button
              type="submit"
              className="auth-neo-primary-btn auth-neo-anim"
              style={{ "--li": 6 }}
              disabled={loading || !backendReady}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {!backendReady && !checking ? (
          <button type="button" onClick={checkBackend} className="auth-neo-secondary-btn">
            Retry Connection
          </button>
        ) : null}

        <p className="auth-neo-footnote auth-neo-anim" style={{ "--li": 9 }}>
          {step === "signup" ? (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          ) : (
            <>
              Need to edit details? <button type="button" className="auth-neo-inline-btn" onClick={() => setStep("signup")}>Go back</button>
            </>
          )}
        </p>
        </section>
      </div>
    </div>
  );
}
