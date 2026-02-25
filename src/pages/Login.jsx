import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminAnalytics, getCaptcha, getCurrentUser, loginWithCaptcha, testBackend } from "../services/api";
import { normalizeRole, setLoggedIn, setRole } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaId, setCaptchaId] = useState("");
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

  useEffect(() => {
    if (!backendReady) {
      return;
    }

    const loadCaptcha = async () => {
      try {
        const challenge = await getCaptcha();
        setCaptcha(challenge?.captcha || "");
        setCaptchaId(challenge?.captchaId || "");
      } catch {
        setError("Could not load captcha. Please retry.");
      }
    };

    loadCaptcha();
  }, [backendReady]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedInputCaptcha = String(form.captcha || "").trim().toUpperCase();
      const normalizedShownCaptcha = String(captcha || "").trim().toUpperCase();

      if (!normalizedInputCaptcha || normalizedInputCaptcha !== normalizedShownCaptcha) {
        throw new Error("Invalid captcha");
      }

      const loginResult = await loginWithCaptcha({
        ...form,
        captcha: normalizedInputCaptcha,
        captchaId
      });

      let role = "";
      try {
        const currentUser = await getCurrentUser();
        const roleFromAuthorities = Array.isArray(currentUser?.authorities)
          ? currentUser.authorities.find((item) => item?.authority || item)?.authority || currentUser.authorities[0]
          : "";

        role = normalizeRole(currentUser?.role || currentUser?.userRole || roleFromAuthorities || loginResult?.role);
      } catch {
        throw new Error("Login succeeded but session verification failed. Please login again.");
      }

      if (!role) {
        try {
          await getAdminAnalytics();
          role = "ADMIN";
        } catch {
          role = "USER";
        }
      }

      if (role !== "ADMIN" && role !== "USER") {
        throw new Error("Unable to determine account role. Contact admin.");
      }

      setLoggedIn(true);
      setRole(role);

      if (role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    } catch (submitError) {
      setLoggedIn(false);
      setRole("");

      const errorText = String(submitError?.message || "");

      if (errorText.includes("misconfigured") || errorText.includes("-parameters")) {
        setError("Login service is temporarily unavailable due to backend configuration. Please contact admin.");
      } else {
        setError(errorText || "Login failed");
      }

      try {
        const refreshed = await getCaptcha();
        setCaptcha(refreshed?.captcha || "");
        setCaptchaId(refreshed?.captchaId || "");
      } catch {
        // no-op
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-neo-shell">
      <div className="auth-neo-card auth-neo-card--login">
        <section className="auth-neo-form-panel">
          <div className="auth-neo-title auth-neo-anim" style={{ "--li": 1 }}>Login</div>
          <div className="auth-neo-health auth-neo-anim" style={{ "--li": 2 }}>
            {checking
              ? "Checking backend..."
              : backendReady
                ? "Backend connected"
                : "Backend offline. Please try again."}
          </div>

          <form onSubmit={onSubmit} className="auth-neo-form">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={onChange}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 3 }}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={onChange}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 4 }}
              required
            />

            <div className="auth-neo-captcha auth-neo-anim" style={{ "--li": 5 }}>{captcha || "------"}</div>
            <input
              type="text"
              name="captcha"
              placeholder="Enter captcha shown above"
              value={form.captcha || ""}
              onChange={onChange}
              className="auth-neo-input auth-neo-anim"
              style={{ "--li": 6 }}
              required
            />

            <button
              type="button"
              onClick={async () => {
                try {
                  const refreshed = await getCaptcha();
                  setCaptcha(refreshed?.captcha || "");
                  setCaptchaId(refreshed?.captchaId || "");
                } catch {
                  setError("Could not refresh captcha. Please retry.");
                }
              }}
              className="auth-neo-secondary-btn auth-neo-anim"
              style={{ "--li": 7 }}
              disabled={!backendReady}
            >
              Refresh Captcha
            </button>

            {error ? <p className="auth-neo-error auth-neo-anim" style={{ "--li": 8 }}>{error}</p> : null}

            <button
              type="submit"
              className="auth-neo-primary-btn auth-neo-anim"
              style={{ "--li": 9 }}
              disabled={loading || !backendReady}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {!backendReady && !checking ? (
            <button type="button" onClick={checkBackend} className="auth-neo-secondary-btn">
              Retry Connection
            </button>
          ) : null}

          <p className="auth-neo-footnote auth-neo-anim" style={{ "--li": 10 }}>
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </section>

        <section className="auth-neo-info-panel">
          <h1 className="auth-neo-welcome auth-neo-anim" style={{ "--li": 2 }}>WELCOME!</h1>
          <p className="auth-neo-copy auth-neo-anim" style={{ "--li": 3 }}>
            We&apos;re delighted to have you here. If you need any assistance, feel free to reach out.
          </p>
          <div className="auth-neo-anim" style={{ "--li": 4 }}>
            <Link to="/" className="auth-neo-link">Back to Home</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
