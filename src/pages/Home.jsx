import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser, logout } from "../services/api";
import { getRole, isLoggedIn, setLoggedIn, setRole } from "../services/auth";
import PaginationControls from "../components/PaginationControls";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videoPage, setVideoPage] = useState(1);

  const videoTopics = useMemo(
    () => [
      { title: "AI Career Paths", tag: "ai", image: "/video-cards/ai.svg" },
      { title: "Data Science", tag: "data", image: "/video-cards/data.svg" },
      { title: "Full Stack", tag: "stack", image: "/video-cards/stack.svg" },
      { title: "Cybersecurity", tag: "security", image: "/video-cards/security.svg" },
      { title: "Cloud Engineering", tag: "cloud", image: "/video-cards/cloud.svg" },
      { title: "UX Design", tag: "ux", image: "/video-cards/ux.svg" },
      { title: "Product Strategy", tag: "product", image: "/video-cards/product.svg" },
      { title: "DevOps", tag: "devops", image: "/video-cards/devops.svg" },
      { title: "Mobile Development", tag: "mobile", image: "/video-cards/mobile.svg" },
      { title: "QA Automation", tag: "qa", image: "/video-cards/qa.svg" },
      { title: "Business Analysis", tag: "business", image: "/video-cards/business.svg" },
      { title: "Digital Marketing", tag: "marketing", image: "/video-cards/marketing.svg" }
    ],
    []
  );

  const videosPerPage = 6;
  const totalVideoPages = Math.max(1, Math.ceil(videoTopics.length / videosPerPage));
  const visibleVideos = useMemo(() => {
    const start = (videoPage - 1) * videosPerPage;
    return videoTopics.slice(start, start + videosPerPage);
  }, [videoPage, videoTopics]);

  const loadCurrentUser = async () => {
    setLoading(true);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      if (isLoggedIn()) {
        setUser({ email: "Authenticated user", role: getRole() || "USER" });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (videoPage > totalVideoPages) {
      setVideoPage(totalVideoPages);
    }
  }, [totalVideoPages, videoPage]);

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      // no-op
    }

    setLoggedIn(false);
    setRole("");
    setUser(null);
  };

  const loggedIn = Boolean(user);
  const role = user?.role || "";

  return (
    <div className="home-shell">
      <div className="home-glow home-glow-top" />
      <div className="home-glow home-glow-bottom" />

      <main className="home-card">
        <p className="home-badge">Career Guidance Platform</p>
        <h1 className="home-title">Career Assessment Tool</h1>
        <p className="home-subtitle">
          Discover your strengths, take guided quizzes, and explore career tracks that match your profile.
        </p>

        <section className="home-stats" aria-label="Platform highlights">
          <article className="home-stat-item">
            <h2>Role Based Access</h2>
            <p>Separate user and admin experiences with protected routes.</p>
          </article>
          <article className="home-stat-item">
            <h2>Assessment Flow</h2>
            <p>Quiz, dashboard, and results pages built for guided progress.</p>
          </article>
          <article className="home-stat-item">
            <h2>Career Discovery</h2>
            <p>Explore relevant career options and improvement pathways.</p>
          </article>
        </section>

        <section className="home-video-showcase" aria-label="Video topic highlights">
          <div className="home-video-header">
            <div>
              <h2 className="home-video-title">Topic Video Library</h2>
              <p className="home-video-subtitle">Curated mini-guides to help you pick the right path.</p>
            </div>
            <PaginationControls
              page={videoPage}
              totalPages={totalVideoPages}
              onPrev={() => setVideoPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setVideoPage((prev) => Math.min(totalVideoPages, prev + 1))}
              ariaLabel="Video topic pagination"
              classPrefix="home-videos"
            />
          </div>

          <div className="home-video-grid">
            {visibleVideos.map((video) => (
              <article key={video.title} className={`home-video-card theme-${video.tag}`}>
                <img className="home-video-img" src={video.image} alt="" loading="lazy" />
                <div className="home-video-overlay" />
                <span className="home-video-badge">Quiz</span>
                <h3 className="home-video-topic">{video.title}</h3>
                <p className="home-video-meta">5-7 min guide</p>
              </article>
            ))}
          </div>
        </section>

        {loading ? <p className="home-meta">Checking session...</p> : null}

        {!loggedIn ? (
          <div className="home-actions">
            <Link to="/login" className="home-action-link">
              <button className="home-btn home-btn-primary">Login</button>
            </Link>
            <Link to="/signup" className="home-action-link">
              <button className="home-btn home-btn-secondary">Sign Up</button>
            </Link>
          </div>
        ) : (
          <section className="home-auth-area">
            <p className="home-meta">Logged in as {user?.email}</p>
            {role === "ADMIN" ? (
              <Link to="/admin" className="home-action-link">
                <button className="home-btn home-btn-portal">Go to Admin Portal</button>
              </Link>
            ) : (
              <Link to="/user" className="home-action-link">
                <button className="home-btn home-btn-portal">Go to User Portal</button>
              </Link>
            )}
            <button onClick={onLogout} className="home-btn home-btn-danger">Logout</button>
          </section>
        )}

        <p className="home-footnote">Built with React + Vite + Route Guards for secure workflow control.</p>
      </main>
    </div>
  );
}
