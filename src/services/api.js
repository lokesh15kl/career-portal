const API_BASE_URL = (() => {
  const configured = String(import.meta.env.VITE_API_BASE_URL || "").trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  // In local dev, default to local backend to avoid accidental remote calls.
  if (import.meta.env.DEV) {
    return "";
  }

  return "https://career-portal-backend.onrender.com";
})();
const ADMIN_QUIZ_CATALOG_STORAGE_KEY = "admin_quiz_catalog";
const MANUAL_QUIZ_QUESTIONS_STORAGE_KEY = "manualQuizQuestions";
const CAREER_CATALOG_STORAGE_KEY = "admin_career_catalog";
const CAREER_SECTIONS_STORAGE_KEY = "admin_career_sections";

const FALLBACK_QUIZ_TITLES_BY_CATEGORY = {
  Technical: ["Programming Fundamentals", "Web Development Basics", "System Design Basics"],
  Aptitude: ["Quantitative Reasoning", "Data Interpretation", "Logical Sequences"],
  Logical: ["Critical Thinking", "Pattern Recognition", "Decision Making"],
  Personality: ["Work Style Assessment", "Communication Profile", "Team Collaboration"],
  "Career Interest": ["Career Interest Inventory", "Role Preference Mapping", "Domain Alignment"]
};

const FALLBACK_CATEGORY_DATA = Object.keys(FALLBACK_QUIZ_TITLES_BY_CATEGORY).map((name, index) => ({
  id: `fallback-${index + 1}`,
  name
}));

const FALLBACK_CAREER_CATALOG = [
  {
    id: "career-1",
    role: "Software Developer",
    category: "Technical",
    skills: "JavaScript, React, Problem Solving",
    path: "Build projects, DSA, internships"
  },
  {
    id: "career-2",
    role: "Data Analyst",
    category: "Aptitude",
    skills: "Excel, SQL, Python, Statistics",
    path: "Analytics projects and dashboards"
  },
  {
    id: "career-3",
    role: "Business Analyst",
    category: "Logical",
    skills: "Requirement analysis, SQL, communication",
    path: "Case studies and product metrics"
  },
  {
    id: "career-4",
    role: "QA Engineer",
    category: "Technical",
    skills: "Testing, automation basics, detail focus",
    path: "Manual testing then automation"
  },
  {
    id: "career-5",
    role: "HR Specialist",
    category: "Personality",
    skills: "Communication, empathy, organization",
    path: "Recruitment and employee engagement"
  },
  {
    id: "career-6",
    role: "Cybersecurity Analyst",
    category: "Logical",
    skills: "Network basics, security tools, analysis",
    path: "Security labs and certifications"
  },
  {
    id: "career-7",
    role: "UI/UX Designer",
    category: "Career Interest",
    skills: "Design thinking, Figma, prototyping",
    path: "Portfolio with case studies"
  },
  {
    id: "career-8",
    role: "Cloud Engineer",
    category: "Technical",
    skills: "Linux, cloud services, scripting",
    path: "Cloud projects and certifications"
  }
];

const FALLBACK_CAREER_SECTIONS = ["Aptitude", "Technical", "Logical", "Personality", "Career Interest"];

function parseJsonStorage(value, fallbackValue) {
  if (!value) return fallbackValue;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function readLocalQuizCatalog() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(ADMIN_QUIZ_CATALOG_STORAGE_KEY);
  const parsed = parseJsonStorage(raw, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

function readLocalManualQuestionMap() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(MANUAL_QUIZ_QUESTIONS_STORAGE_KEY);
  const parsed = parseJsonStorage(raw, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

function normalizeCareerRecord(item, index = 0) {
  if (!item || typeof item !== "object") return null;

  const role = normalizeText(item.role || item.title || item.name);
  const category = normalizeText(item.category || item.section || item.track);
  const skills = normalizeText(item.skills || item.skillSet || item.requiredSkills);
  const path = normalizeText(item.path || item.roadmap || item.learningPath);

  if (!role || !category || !skills || !path) {
    return null;
  }

  const rawId = normalizeText(item.id || item.careerId);
  const id = rawId || `career-${role.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`;

  return { id, role, category, skills, path };
}

function normalizeCareerCatalog(data) {
  if (!Array.isArray(data)) return [];

  return data
    .map((item, index) => normalizeCareerRecord(item, index))
    .filter(Boolean);
}

function normalizeSectionList(data) {
  if (!Array.isArray(data)) return [];

  return Array.from(
    new Set(
      data
        .map((item) => normalizeText(item?.name || item?.section || item))
        .filter(Boolean)
    )
  );
}

function readLocalCareerCatalog() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CAREER_CATALOG_STORAGE_KEY);
  const parsed = parseJsonStorage(raw, []);
  return normalizeCareerCatalog(parsed);
}

function writeLocalCareerCatalog(careers) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CAREER_CATALOG_STORAGE_KEY, JSON.stringify(careers));
}

function readLocalCareerSections() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CAREER_SECTIONS_STORAGE_KEY);
  const parsed = parseJsonStorage(raw, []);
  return normalizeSectionList(parsed);
}

function writeLocalCareerSections(sections) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CAREER_SECTIONS_STORAGE_KEY, JSON.stringify(sections));
}

function getLocalCategoryNames() {
  const categories = new Set();

  Object.keys(readLocalQuizCatalog()).forEach((category) => {
    const normalized = normalizeText(category);
    if (normalized) categories.add(normalized);
  });

  Object.values(readLocalManualQuestionMap()).forEach((questions) => {
    if (!Array.isArray(questions)) return;
    questions.forEach((item) => {
      const category = normalizeText(item?.category);
      if (category) categories.add(category);
    });
  });

  return Array.from(categories);
}

function getLocalQuizTitlesByCategory(category) {
  const normalizedCategory = normalizeText(category);
  if (!normalizedCategory) return [];

  const titles = new Set();
  const loweredCategory = normalizedCategory.toLowerCase();

  const catalog = readLocalQuizCatalog();
  Object.entries(catalog).forEach(([catalogCategory, value]) => {
    if (String(catalogCategory || "").trim().toLowerCase() !== loweredCategory) return;
    if (!Array.isArray(value)) return;

    value.forEach((quizTitle) => {
      const title = normalizeText(quizTitle);
      if (title) titles.add(title);
    });
  });

  const manualQuestions = readLocalManualQuestionMap();
  Object.values(manualQuestions).forEach((questions) => {
    if (!Array.isArray(questions)) return;

    questions.forEach((item) => {
      const itemCategory = normalizeText(item?.category).toLowerCase();
      if (itemCategory !== loweredCategory) return;

      const title = normalizeText(item?.quizName || item?.quizTitle);
      if (title) titles.add(title);
    });
  });

  return Array.from(titles);
}

function normalizeAttemptQuestions(data) {
  if (!Array.isArray(data)) return [];

  return data
    .map((item, index) => {
      const questionType = normalizeText(item?.questionType || item?.type || "mcq").toLowerCase();
      const optionsFromArray = Array.isArray(item?.options) ? item.options : [];

      const option1 = normalizeText(item?.option1 || optionsFromArray[0]);
      const option2 = normalizeText(item?.option2 || optionsFromArray[1]);
      const option3 = normalizeText(item?.option3 || optionsFromArray[2]);
      const option4 = normalizeText(item?.option4 || optionsFromArray[3]);
      const question = normalizeText(item?.question || item?.questionText);
      const isMcq = questionType === "mcq";

      if (!question) {
        return null;
      }

      if (isMcq && (!option1 || !option2 || !option3 || !option4)) {
        return null;
      }

      return {
        id: item?.id ?? `local-q-${index + 1}`,
        questionType: isMcq ? "mcq" : questionType,
        question,
        option1: isMcq ? option1 : "",
        option2: isMcq ? option2 : "",
        option3: isMcq ? option3 : "",
        option4: isMcq ? option4 : "",
        correctAnswer: normalizeText(item?.correctAnswer)
      };
    })
    .filter(Boolean);
}

function getLocalAttemptQuestions(category, quizTitle) {
  const normalizedCategory = normalizeText(category).toLowerCase();
  const normalizedQuizTitle = normalizeText(quizTitle).toLowerCase();
  if (!normalizedCategory || !normalizedQuizTitle) return [];

  const manualQuestionMap = readLocalManualQuestionMap();
  const collected = [];

  Object.values(manualQuestionMap).forEach((questions) => {
    if (!Array.isArray(questions)) return;

    const matched = questions.filter((item) => {
      const itemCategory = normalizeText(item?.category).toLowerCase();
      const itemQuizTitle = normalizeText(item?.quizName || item?.quizTitle).toLowerCase();
      return itemCategory === normalizedCategory && itemQuizTitle === normalizedQuizTitle;
    });

    if (matched.length > 0) {
      collected.push(...matched);
    }
  });

  return normalizeAttemptQuestions(collected);
}

function normalizeServerError(message) {
  const text = String(message || "");

  if (
    text.includes("Name for argument of type") ||
    text.includes("-parameters") ||
    text.includes("parameter name information not available via reflection")
  ) {
    return "Backend endpoint is misconfigured. Please try again or contact admin.";
  }

  if (text.toLowerCase().includes("no static resource")) {
    return "Backend category endpoint is not available. Please enable category APIs in backend.";
  }

  if (text.includes("404") || text.toLowerCase().includes("not found")) {
    return "Requested backend endpoint was not found.";
  }

  return text;
}

function normalizeCategoryList(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  const normalized = data
    .map((item, index) => {
      if (typeof item === "string") {
        const name = item.trim();
        return name ? { id: `category-${index + 1}`, name } : null;
      }

      if (item && typeof item === "object") {
        const name = String(item.name || item.category || item.title || "").trim();
        if (!name) return null;

        const id = item.id ?? item.categoryId ?? `category-${index + 1}`;
        return { id, name };
      }

      return null;
    })
    .filter(Boolean);

  return normalized;
}

function normalizeQuizTitles(data) {
  if (Array.isArray(data)) {
    return data
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          return String(item.title || item.quizTitle || item.name || "").trim();
        }

        return "";
      })
      .filter(Boolean);
  }

  if (typeof data === "string") {
    const text = data.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return normalizeQuizTitles(parsed);
    } catch {
      return text
        .split(/,|\n/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (data && typeof data === "object") {
    return normalizeQuizTitles(data.quizzes || data.quizList || data.data || []);
  }

  return [];
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,|;|\|/)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  return [];
}

function normalizeCareerInsightResponse(data, fallbackCareer) {
  const role = normalizeText(
    data?.role ||
    data?.career ||
    data?.title ||
    fallbackCareer?.role ||
    "Career"
  );

  const category = normalizeText(data?.category || fallbackCareer?.category || "General");
  const skills = toList(data?.skills || data?.requiredSkills || fallbackCareer?.skills || []);
  const roadmap = toList(data?.roadmap || data?.learningPath || fallbackCareer?.path || []);

  const suggestionsRaw =
    data?.suggestions ||
    data?.recommendedRoles ||
    data?.relatedCareers ||
    data?.alternatives ||
    [];

  const suggestions = Array.isArray(suggestionsRaw)
    ? suggestionsRaw
      .map((item) => {
        if (typeof item === "string") {
          const title = normalizeText(item);
          return title ? { title, reason: "Related role based on skill overlap." } : null;
        }

        if (item && typeof item === "object") {
          const title = normalizeText(item.title || item.role || item.name);
          const reason = normalizeText(item.reason || item.why || "Related role based on skill overlap.");
          return title ? { title, reason } : null;
        }

        return null;
      })
      .filter(Boolean)
    : [];

  const overview = normalizeText(
    data?.overview ||
    data?.summary ||
    data?.description ||
    `${role} focuses on practical responsibilities in ${category.toLowerCase()} workflows.`
  );

  const responsibilities = toList(
    data?.responsibilities ||
    data?.dayToDay ||
    data?.tasks ||
    []
  );

  const tools = toList(data?.tools || data?.technologies || data?.tooling || []);
  const salaryRange = normalizeText(data?.salaryRange || data?.salary || data?.compensation || "Varies by location and experience");
  const futureScope = normalizeText(data?.futureScope || data?.growth || data?.outlook || "Steady demand with continuous upskilling.");

  return {
    role,
    category,
    overview,
    skills: skills.length ? skills : toList(fallbackCareer?.skills || []),
    roadmap: roadmap.length ? roadmap : toList(fallbackCareer?.path || []),
    responsibilities,
    tools,
    salaryRange,
    futureScope,
    suggestions
  };
}

function buildFallbackCareerInsight(careerQuery, catalog) {
  const query = normalizeText(careerQuery).toLowerCase();
  const fallbackCareer =
    catalog.find((item) => normalizeText(item.role).toLowerCase().includes(query)) ||
    catalog.find((item) => normalizeText(item.category).toLowerCase().includes(query)) ||
    catalog[0] ||
    FALLBACK_CAREER_CATALOG[0];

  const suggestions = catalog
    .filter((item) => item.role !== fallbackCareer.role)
    .filter((item) => item.category === fallbackCareer.category)
    .slice(0, 4)
    .map((item) => ({
      title: item.role,
      reason: `Similar ${item.category} career path with overlapping skills.`
    }));

  return normalizeCareerInsightResponse(
    {
      role: fallbackCareer.role,
      category: fallbackCareer.category,
      overview: `${fallbackCareer.role} is a strong option for learners interested in ${fallbackCareer.category.toLowerCase()} outcomes. Focus on practical projects and role-specific execution to grow faster.`,
      requiredSkills: fallbackCareer.skills,
      learningPath: fallbackCareer.path,
      responsibilities: [
        "Understand business or product requirements.",
        "Execute role-specific tasks with quality and consistency.",
        "Collaborate with teams and communicate progress.",
        "Continuously upskill with hands-on projects."
      ],
      tools: ["Role-based tools", "Documentation", "Collaboration platforms"],
      salaryRange: "Depends on city, company, and experience level",
      futureScope: `Good long-term growth in ${fallbackCareer.category.toLowerCase()} domains with continuous practice.`,
      suggestions
    },
    fallbackCareer
  );
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options
    });
  } catch {
    throw new Error(
      "Backend is not reachable. Please ensure the backend server is running and try again."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || `Request failed (${response.status})`;
    throw new Error(normalizeServerError(message) || "Request failed");
  }

  return data;
}

export async function testBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/captcha`, {
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error("Backend check failed");
    }

    return true;
  } catch {
    throw new Error("Backend is not reachable");
  }
}

export async function getCurrentUser() {
  return request("/api/auth/me");
}

export async function login(email, password) {
  const body = new URLSearchParams({ email, password }).toString();
  return request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}

export async function getCaptcha() {
  const data = await request("/api/captcha");

  if (typeof data === "string") {
    const text = data.trim();

    if (!text) {
      return { captcha: "", captchaId: "" };
    }

    if (text.startsWith("<")) {
      const plainFromHtml = text
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return { captcha: plainFromHtml, captchaId: "" };
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        return {
          captcha: String(
            parsed.captcha ?? parsed.value ?? parsed.text ?? parsed.code ?? ""
          ).trim(),
          captchaId: String(parsed.captchaId ?? parsed.id ?? "").trim()
        };
      }
    } catch {
      // plain text captcha
    }

    return { captcha: text, captchaId: "" };
  }

  if (data && typeof data === "object") {
    return {
      captcha: String(data.captcha ?? data.value ?? data.text ?? data.code ?? "").trim(),
      captchaId: String(data.captchaId ?? data.id ?? "").trim()
    };
  }

  return { captcha: "", captchaId: "" };
}

export async function loginWithCaptcha({ email, password, captcha, captchaId }) {
  const params = new URLSearchParams();
  params.append("email", email);
  params.append("password", password);
  params.append("captcha", captcha);

  if (captchaId) {
    params.append("captchaId", captchaId);
  }

  const body = params.toString();

  const response = await request("/doLogin", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  // Handle JSON response from backend
  if (typeof response === 'object' && response.success) {
    return { role: response.role || "USER" };
  }

  // Handle HTML response (legacy)
  const text = String(response || "");

  if (text.includes("Invalid captcha")) {
    throw new Error("Invalid captcha");
  }

  if (text.includes("Email not found")) {
    throw new Error("Email not found");
  }

  if (text.includes("Wrong password")) {
    throw new Error("Wrong password");
  }

  if (text.includes("Invalid credentials")) {
    throw new Error("Invalid credentials");
  }

  if (text.includes("Admin Dashboard")) {
    return { role: "ADMIN" };
  }

  if (text.includes("Select Assessment")) {
    return { role: "USER" };
  }

  throw new Error("Login failed. Please check credentials and captcha.");
}

export async function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export async function updateCurrentUserProfile({ name, profileImageUrl }) {
  const payload = {
    name: normalizeText(name),
    profileImageUrl: normalizeText(profileImageUrl)
  };

  if (!payload.name) {
    throw new Error("Name is required.");
  }

  return request("/api/auth/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function changeCurrentUserPassword({ currentPassword, newPassword }) {
  const payload = {
    currentPassword: normalizeText(currentPassword),
    newPassword: normalizeText(newPassword)
  };

  if (!payload.currentPassword || !payload.newPassword) {
    throw new Error("Current and new passwords are required.");
  }

  return request("/api/auth/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function sendOtp({ name, email, password }) {
  const body = new URLSearchParams({ name, email, password }).toString();
  return request("/sendOtp", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}

export async function verifyOtp(otp) {
  const body = new URLSearchParams({ otp }).toString();
  return request("/verifyOtp", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}

export async function getCategories() {
  const localCategoryNames = getLocalCategoryNames();

  try {
    const data = await request("/api/categories");
    const normalized = normalizeCategoryList(data);

    const mergedByLowerName = new Map(
      normalized.map((item) => [item.name.toLowerCase(), item])
    );

    localCategoryNames.forEach((name) => {
      const lowered = name.toLowerCase();
      if (!mergedByLowerName.has(lowered)) {
        mergedByLowerName.set(lowered, {
          id: `local-${lowered.replace(/[^a-z0-9]+/g, "-")}`,
          name
        });
      }
    });

    const merged = Array.from(mergedByLowerName.values());
    return merged.length > 0 ? merged : FALLBACK_CATEGORY_DATA;
  } catch {
    const base = [...FALLBACK_CATEGORY_DATA];
    const existing = new Set(base.map((item) => item.name.toLowerCase()));

    localCategoryNames.forEach((name) => {
      const lowered = name.toLowerCase();
      if (!existing.has(lowered)) {
        base.push({
          id: `local-${lowered.replace(/[^a-z0-9]+/g, "-")}`,
          name
        });
      }
    });

    return base;
  }
}

export async function getAdminAssessmentCategories() {
  const localCategoryNames = getLocalCategoryNames();
  const endpoints = [
    "/api/admin/categories",
    "/api/categories",
    "/api/admin/assessments/categories",
    "/api/assessments/categories",
    "/legacy/admin/categories",
    "/legacy/admin/getCategories"
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await request(endpoint);
      const normalized = normalizeCategoryList(response);
      const names = normalized.map((item) => item.name).filter(Boolean);
      if (names.length > 0 || localCategoryNames.length > 0) {
        return Array.from(new Set([...names, ...localCategoryNames]));
      }
    } catch {
      // keep trying other endpoints
    }
  }

  if (localCategoryNames.length > 0) {
    return localCategoryNames;
  }

  return FALLBACK_CATEGORY_DATA.map((item) => item.name);
}

export async function addAdminAssessmentCategory({ name, note }) {
  const normalizedName = normalizeText(name);
  const normalizedNote = normalizeText(note);

  if (!normalizedName) {
    throw new Error("Assessment category name is required.");
  }

  const jsonPayload = JSON.stringify({
    name: normalizedName,
    note: normalizedNote,
    title: normalizedName,
    description: normalizedNote
  });

  const formPayload = new URLSearchParams({
    name: normalizedName,
    title: normalizedName,
    note: normalizedNote,
    description: normalizedNote
  }).toString();

  const attempts = [
    {
      path: "/api/admin/categories",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload
      }
    },
    {
      path: "/api/categories",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload
      }
    },
    {
      path: "/api/admin/assessments/categories",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload
      }
    },
    {
      path: "/api/admin/categories/add",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload
      }
    },
    {
      path: "/api/admin/category",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonPayload
      }
    },
    {
      path: "/legacy/admin/addCategory",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formPayload
      }
    },
    {
      path: "/legacy/admin/addAssessmentCategory",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formPayload
      }
    },
    {
      path: "/legacy/admin/addCategory",
      options: {
        method: "GET"
      }
    },
    {
      path: `/legacy/admin/addCategory?${new URLSearchParams({
        name: normalizedName,
        category: normalizedName,
        title: normalizedName,
        note: normalizedNote,
        description: normalizedNote
      }).toString()}`,
      options: {
        method: "GET"
      }
    },
    {
      path: `/legacy/admin/addAssessmentCategory?${new URLSearchParams({
        name: normalizedName,
        category: normalizedName,
        title: normalizedName,
        note: normalizedNote,
        description: normalizedNote
      }).toString()}`,
      options: {
        method: "GET"
      }
    }
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      await request(attempt.path, attempt.options);
      return { name: normalizedName, note: normalizedNote };
    } catch (error) {
      lastError = error;
    }
  }

  const normalized = normalizeServerError(lastError?.message || "");
  throw new Error(normalized || "Unable to add assessment category in backend.");
}

export async function deleteAdminAssessmentCategory(name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) {
    throw new Error("Assessment category name is required.");
  }

  const payload = JSON.stringify({ name: normalizedName, title: normalizedName });
  const encodedName = encodeURIComponent(normalizedName);

  const attempts = [
    {
      path: `/api/admin/categories/${encodedName}`,
      options: { method: "DELETE" }
    },
    {
      path: `/api/categories/${encodedName}`,
      options: { method: "DELETE" }
    },
    {
      path: `/api/admin/category/${encodedName}`,
      options: { method: "DELETE" }
    },
    {
      path: "/api/admin/categories",
      options: {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: payload
      }
    },
    {
      path: "/api/categories",
      options: {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: payload
      }
    },
    {
      path: `/api/admin/categories/delete?${new URLSearchParams({
        name: normalizedName,
        category: normalizedName,
        title: normalizedName
      }).toString()}`,
      options: { method: "DELETE" }
    },
    {
      path: "/legacy/admin/deleteCategory",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          name: normalizedName,
          category: normalizedName,
          title: normalizedName
        }).toString()
      }
    },
    {
      path: "/legacy/admin/removeCategory",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          name: normalizedName,
          category: normalizedName,
          title: normalizedName
        }).toString()
      }
    },
    {
      path: `/legacy/admin/deleteCategory?${new URLSearchParams({ name: normalizedName }).toString()}`,
      options: { method: "GET" }
    },
    {
      path: `/legacy/admin/removeCategory?${new URLSearchParams({
        name: normalizedName,
        category: normalizedName,
        title: normalizedName
      }).toString()}`,
      options: { method: "GET" }
    }
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      await request(attempt.path, attempt.options);
      return { success: true };
    } catch (error) {
      lastError = error;
    }
  }

  const normalized = normalizeServerError(lastError?.message || "");
  throw new Error(normalized || "Unable to delete assessment category in backend.");
}

export async function getQuizList(category) {
  const normalizedCategory = String(category || "").trim();
  const categoryVariants = Array.from(new Set([
    normalizedCategory,
    normalizedCategory.replace(/\s+assessment$/i, "").trim(),
    /\s+assessment$/i.test(normalizedCategory)
      ? normalizedCategory
      : `${normalizedCategory} Assessment`
  ].filter(Boolean)));

  const localTitles = categoryVariants.flatMap((item) => getLocalQuizTitlesByCategory(item));

  const backendTitles = [];
  for (const variant of categoryVariants) {
    const query = new URLSearchParams({ category: variant }).toString();

    try {
      const data = await request(`/api/quizList?${query}`);
      backendTitles.push(...normalizeQuizTitles(data));
    } catch {
      // try remaining variants
    }
  }

  const mergedTitles = Array.from(new Set([...backendTitles, ...localTitles]));
  if (mergedTitles.length > 0) {
    return mergedTitles;
  }

  if (!normalizedCategory) {
    return [];
  }

  const directMatch = FALLBACK_QUIZ_TITLES_BY_CATEGORY[normalizedCategory];
  if (directMatch) {
    return directMatch;
  }

  const loweredCategory = normalizedCategory.toLowerCase();
  const fuzzyMatchKey = Object.keys(FALLBACK_QUIZ_TITLES_BY_CATEGORY).find(
    (key) => key.toLowerCase() === loweredCategory
  );

  const fallbackTitles = fuzzyMatchKey ? FALLBACK_QUIZ_TITLES_BY_CATEGORY[fuzzyMatchKey] : [];

  return Array.from(new Set([...(fallbackTitles || []), ...localTitles]));
}

export async function attemptQuiz(category, quizTitle) {
  const normalizedCategory = normalizeText(category);
  const categoryVariants = Array.from(new Set([
    normalizedCategory,
    normalizedCategory.replace(/\s+assessment$/i, "").trim(),
    /\s+assessment$/i.test(normalizedCategory)
      ? normalizedCategory
      : `${normalizedCategory} Assessment`
  ].filter(Boolean)));

  for (const variant of categoryVariants) {
    const query = new URLSearchParams({ category: variant, quizTitle }).toString();

    try {
      const data = await request(`/api/attemptQuiz?${query}`);
      const normalized = normalizeAttemptQuestions(data);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // try remaining variants
    }
  }

  return getLocalAttemptQuestions(category, quizTitle);
}

export async function submitQuiz(answers) {
  const body = new URLSearchParams(answers).toString();
  return request("/api/submitQuiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}
export async function submitQuizWithTypedQuestions({
  answers,
  questions,
  audioResponses,
  category,
  quizTitle
}) {
  const normalizedAnswers = answers && typeof answers === "object" ? answers : {};
  const normalizedQuestions = Array.isArray(questions) ? questions : [];
  const normalizedAudioResponses = audioResponses && typeof audioResponses === "object" ? audioResponses : {};

  const hasWrittenQuestions = normalizedQuestions.some(
    (item) => normalizeText(item?.questionType || "mcq").toLowerCase() === "written"
  );
  const hasAudioFiles = Object.values(normalizedAudioResponses).some(
    (item) => item?.blob instanceof Blob
  );

  if (!hasWrittenQuestions && !hasAudioFiles) {
    return submitQuiz(normalizedAnswers);
  }

  const formData = new FormData();
  Object.entries(normalizedAnswers).forEach(([key, value]) => {
    formData.append(key, String(value ?? ""));
  });

  formData.append("category", normalizeText(category));
  formData.append("quizTitle", normalizeText(quizTitle));

  if (hasAudioFiles) {
    const audioMeta = [];

    Object.entries(normalizedAudioResponses)
      .filter(([, item]) => item?.blob instanceof Blob)
      .forEach(([questionKey, item], index) => {
        const mimeType = item.blob.type || "audio/webm";
        const extension = mimeType.includes("wav") ? "wav" : mimeType.includes("mpeg") ? "mp3" : "webm";
        const fileName = `${questionKey}-${Date.now()}-${index + 1}.${extension}`;

        formData.append("audioResponses", item.blob, fileName);
        formData.append(`${questionKey}_audio`, item.blob, fileName);

        audioMeta.push({
          questionKey,
          fileName,
          mimeType,
          size: item.blob.size
        });
      });

    formData.append("audioMeta", JSON.stringify(audioMeta));
  }

  const endpoints = [
    "/api/submitQuizWithAudio",
    "/api/submitQuiz"
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      return await request(endpoint, {
        method: "POST",
        body: formData
      });
    } catch (error) {
      lastError = error;
    }
  }

  try {
    return await submitQuiz(normalizedAnswers);
  } catch (fallbackError) {
    throw new Error(
      lastError?.message || fallbackError?.message || "Failed to submit quiz with typed questions."
    );
  }
}

export async function getAdminAnalytics() {
  return request("/api/admin/analytics");
}

export async function getAiGenerationStatus() {
  try {
    const data = await request("/api/ai/status");
    return {
      available: Boolean(data?.available),
      message: String(data?.message || "AI service status is available."),
      features: Array.isArray(data?.features) ? data.features : []
    };
  } catch (error) {
    return {
      available: false,
      message: error?.message || "AI generation service is unavailable right now.",
      features: []
    };
  }
}

export async function generateAiAssessmentForAdmin({
  category,
  quizTitle,
  topic,
  difficulty = "medium",
  questionCount = 8,
  replaceExisting = true
}) {
  const payload = {
    category: normalizeText(category),
    quizTitle: normalizeText(quizTitle),
    topic: normalizeText(topic),
    difficulty: normalizeText(difficulty || "medium").toLowerCase(),
    questionCount: Number(questionCount) || 8,
    replaceExisting: Boolean(replaceExisting)
  };

  if (!payload.category || !payload.quizTitle) {
    throw new Error("Category and quiz title are required for AI generation.");
  }

  return request("/api/admin/ai/generate-assessment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function generateAiPracticeQuiz({
  category,
  topic,
  difficulty = "medium",
  questionCount = 6,
  quizTitle
}) {
  const normalizedTopic = normalizeText(topic);
  const normalizedCategory = normalizeText(category) || normalizedTopic;

  const payload = {
    category: normalizedCategory,
    topic: normalizedTopic,
    difficulty: normalizeText(difficulty || "medium").toLowerCase(),
    questionCount: Number(questionCount) || 6,
    quizTitle: normalizeText(quizTitle) || `${normalizedTopic || "Practice"} Quiz`
  };

  if (!payload.topic) {
    throw new Error("Topic is required for AI practice generation.");
  }

  return request("/api/ai/generate-practice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

export async function createAdminQuiz({ assessment, quizName }) {
  const category = String(assessment || "").trim();
  const title = String(quizName || "").trim();

  if (!category || !title) {
    throw new Error("Assessment and quiz name are required.");
  }

  const attempts = [
    {
      path: "/generate-quiz",
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ category, quizTitle: title }).toString()
      }
    },
    {
      path: "/generate-quiz",
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ category, quizName: title }).toString()
      }
    },
    {
      path: "/api/admin/quizzes",
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ category, quizTitle: title })
      }
    },
    {
      path: "/api/admin/quizzes",
      options: {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ assessment: category, quizName: title })
      }
    }
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const result = await request(attempt.path, attempt.options);
      return result;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Unable to create quiz in backend.");
}

export async function saveManualQuestion({
  category,
  quizName,
  questionText,
  questionType,
  options,
  correctAnswer
}) {
  const normalizedType = normalizeText(questionType || "mcq").toLowerCase();
  const optionList = Array.isArray(options)
    ? options.map((opt) => normalizeText(opt)).filter(Boolean)
    : [];

  if (!category || !quizName || !questionText || !correctAnswer) {
    throw new Error("All question fields are required.");
  }

  if (normalizedType === "mcq" && optionList.length !== 4) {
    throw new Error("MCQ questions require 4 options.");
  }

  // POST form-encoded to the working QuizController endpoint
  const formData = new URLSearchParams({
    category: category.trim(),
    quizTitle: quizName.trim(),
    question: questionText.trim(),
    option1: normalizedType === "mcq" ? optionList[0] : "N/A",
    option2: normalizedType === "mcq" ? optionList[1] : "N/A",
    option3: normalizedType === "mcq" ? optionList[2] : "N/A",
    option4: normalizedType === "mcq" ? optionList[3] : "N/A",
    answer: correctAnswer.trim(),
    questionType: normalizedType
  }).toString();

  console.log("=== SENDING QUESTION TO BACKEND ===");
  console.log("FormData: " + formData);
  console.log("QuestionType being sent: " + normalizedType);
  console.log("====================================");

  try {
    const result = await request("/admin/saveManualQuiz", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    console.log("Question saved to backend successfully");
    return result;
  } catch (error) {
    console.error("Backend save failed:", error.message);
    throw error;
  }
}

export async function getManualQuestions(category, quizName) {
  if (!category || !quizName) {
    throw new Error("Category and quiz name are required.");
  }

  const endpoints = [
    `/api/admin/questions?category=${encodeURIComponent(category)}&quizName=${encodeURIComponent(quizName)}`,
    `/admin/manualQuiz/questions?category=${encodeURIComponent(category)}&quizName=${encodeURIComponent(quizName)}`,
    `/api/admin/manualQuiz/questions?category=${encodeURIComponent(category)}&quizName=${encodeURIComponent(quizName)}`
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const result = await request(endpoint);
      if (Array.isArray(result)) {
        return result;
      }
      if (result && Array.isArray(result.questions)) {
        return result.questions;
      }
      return [];
    } catch (error) {
      lastError = error;
    }
  }

  console.warn("Unable to fetch questions from backend:", lastError);
  return [];
}

export async function getCareerCatalog() {
  const localCareers = readLocalCareerCatalog();

  const endpoints = ["/api/careers", "/api/admin/careers"];
  for (const endpoint of endpoints) {
    try {
      const response = await request(endpoint);
      const serverCatalog = normalizeCareerCatalog(
        Array.isArray(response) ? response : response?.careers || response?.data || []
      );

      if (serverCatalog.length > 0 || localCareers.length > 0) {
        const mergedMap = new Map();
        [...localCareers, ...serverCatalog].forEach((item) => {
          mergedMap.set(`${item.role.toLowerCase()}::${item.category.toLowerCase()}`, item);
        });

        const merged = Array.from(mergedMap.values());
        writeLocalCareerCatalog(merged);
        return merged;
      }
    } catch {
      // fallback below
    }
  }

  if (localCareers.length > 0) {
    return localCareers;
  }

  writeLocalCareerCatalog(FALLBACK_CAREER_CATALOG);
  return FALLBACK_CAREER_CATALOG;
}

export async function getCareerInsights(careerQuery) {
  const normalizedQuery = normalizeText(careerQuery);
  if (!normalizedQuery) {
    throw new Error("Career search query is required.");
  }

  const catalog = await getCareerCatalog();
  const primaryCareer =
    catalog.find((item) => normalizeText(item.role).toLowerCase() === normalizedQuery.toLowerCase()) ||
    catalog.find((item) => normalizeText(item.role).toLowerCase().includes(normalizedQuery.toLowerCase())) ||
    catalog.find((item) => normalizeText(item.category).toLowerCase().includes(normalizedQuery.toLowerCase())) ||
    null;

  const payload = {
    career: normalizedQuery,
    role: normalizedQuery,
    category: primaryCareer?.category || "",
    context: primaryCareer || null
  };

  const attempts = [
    {
      path: "/api/ai/career-insights",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    },
    {
      path: "/api/ai/career-guide",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    },
    {
      path: `/api/ai/career-search?${new URLSearchParams({ query: normalizedQuery }).toString()}`,
      options: { method: "GET" }
    }
  ];

  for (const attempt of attempts) {
    try {
      const response = await request(attempt.path, attempt.options);
      return normalizeCareerInsightResponse(response, primaryCareer);
    } catch {
      // try next endpoint
    }
  }

  return buildFallbackCareerInsight(normalizedQuery, catalog);
}

export async function addCareerProfile({ role, category, skills, path }) {
  const normalizedCareer = normalizeCareerRecord({ role, category, skills, path }, 0);

  if (!normalizedCareer) {
    throw new Error("Role, category, skills, and path are required.");
  }

  const payload = {
    role: normalizedCareer.role,
    category: normalizedCareer.category,
    skills: normalizedCareer.skills,
    path: normalizedCareer.path
  };

  const attempts = [
    {
      path: "/api/admin/careers",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    },
    {
      path: "/api/careers",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    }
  ];

  for (const attempt of attempts) {
    try {
      const created = await request(attempt.path, attempt.options);
      const normalizedFromServer = normalizeCareerRecord(created || payload, 0) || normalizedCareer;
      const existing = readLocalCareerCatalog();
      const updated = [
        ...existing.filter(
          (item) =>
            `${item.role.toLowerCase()}::${item.category.toLowerCase()}` !==
            `${normalizedFromServer.role.toLowerCase()}::${normalizedFromServer.category.toLowerCase()}`
        ),
        normalizedFromServer
      ];
      writeLocalCareerCatalog(updated);
      return normalizedFromServer;
    } catch {
      // keep trying endpoints
    }
  }

  const existing = readLocalCareerCatalog();
  const deduped = [
    ...existing.filter(
      (item) =>
        `${item.role.toLowerCase()}::${item.category.toLowerCase()}` !==
        `${normalizedCareer.role.toLowerCase()}::${normalizedCareer.category.toLowerCase()}`
    ),
    normalizedCareer
  ];
  writeLocalCareerCatalog(deduped);
  return normalizedCareer;
}

export async function updateCareerProfile(careerId, updates) {
  const normalizedId = normalizeText(careerId);
  const normalizedCareer = normalizeCareerRecord({ ...(updates || {}), id: normalizedId }, 0);

  if (!normalizedCareer) {
    throw new Error("Role, category, skills, and path are required.");
  }

  if (!normalizedId) {
    return addCareerProfile(normalizedCareer);
  }

  const payload = {
    id: normalizedCareer.id,
    role: normalizedCareer.role,
    category: normalizedCareer.category,
    skills: normalizedCareer.skills,
    path: normalizedCareer.path
  };

  const encodedId = encodeURIComponent(normalizedId);
  const attempts = [
    {
      path: `/api/admin/careers/${encodedId}`,
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    },
    {
      path: `/api/careers/${encodedId}`,
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    }
  ];

  for (const attempt of attempts) {
    try {
      const result = await request(attempt.path, attempt.options);
      const normalizedFromServer = normalizeCareerRecord(result || payload, 0) || normalizedCareer;
      const existing = readLocalCareerCatalog();
      const updated = existing.map((item) =>
        String(item.id) === normalizedId ? normalizedFromServer : item
      );
      writeLocalCareerCatalog(updated);
      return normalizedFromServer;
    } catch {
      // fallback to local
    }
  }

  const existing = readLocalCareerCatalog();
  const updated = existing.map((item) =>
    String(item.id) === normalizedId ? normalizedCareer : item
  );
  writeLocalCareerCatalog(updated);
  return normalizedCareer;
}

export async function deleteCareerProfile(careerId) {
  const normalizedId = normalizeText(careerId);
  if (!normalizedId) {
    throw new Error("Career id is required.");
  }

  const encodedId = encodeURIComponent(normalizedId);
  const attempts = [
    {
      path: `/api/admin/careers/${encodedId}`,
      options: { method: "DELETE" }
    },
    {
      path: `/api/careers/${encodedId}`,
      options: { method: "DELETE" }
    }
  ];

  for (const attempt of attempts) {
    try {
      await request(attempt.path, attempt.options);
      break;
    } catch {
      // fallback to local
    }
  }

  const existing = readLocalCareerCatalog();
  const updated = existing.filter((item) => String(item.id) !== normalizedId);
  writeLocalCareerCatalog(updated);
  return updated;
}

export async function getCareerSections() {
  const localSections = readLocalCareerSections();

  const endpoints = ["/api/careers/sections", "/api/admin/careers/sections"];
  for (const endpoint of endpoints) {
    try {
      const response = await request(endpoint);
      const serverSections = normalizeSectionList(
        Array.isArray(response) ? response : response?.sections || response?.data || []
      );

      const fromCatalog = (await getCareerCatalog()).map((item) => item.category);
      const merged = normalizeSectionList([
        ...FALLBACK_CAREER_SECTIONS,
        ...localSections,
        ...fromCatalog,
        ...serverSections
      ]);

      writeLocalCareerSections(merged);
      return merged;
    } catch {
      // fallback below
    }
  }

  const fromCatalog = (await getCareerCatalog()).map((item) => item.category);
  const merged = normalizeSectionList([
    ...FALLBACK_CAREER_SECTIONS,
    ...localSections,
    ...fromCatalog
  ]);

  writeLocalCareerSections(merged);
  return merged;
}

export async function addCareerSection(sectionName) {
  const name = normalizeText(sectionName);
  if (!name) {
    throw new Error("Section name is required.");
  }

  const attempts = [
    {
      path: "/api/admin/careers/sections",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      }
    },
    {
      path: "/api/careers/sections",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      }
    }
  ];

  for (const attempt of attempts) {
    try {
      await request(attempt.path, attempt.options);
      break;
    } catch {
      // fallback to local storage
    }
  }

  const localSections = readLocalCareerSections();
  const merged = normalizeSectionList([...FALLBACK_CAREER_SECTIONS, ...localSections, name]);
  writeLocalCareerSections(merged);
  return merged;
}

export async function updateCareerSection(previousName, nextName) {
  const oldName = normalizeText(previousName);
  const newName = normalizeText(nextName);

  if (!oldName || !newName) {
    throw new Error("Both current and new section names are required.");
  }

  const oldLower = oldName.toLowerCase();
  const newLower = newName.toLowerCase();

  if (oldLower === newLower) {
    return getCareerSections();
  }

  const attempts = [
    {
      path: "/api/admin/careers/sections",
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName })
      }
    },
    {
      path: "/api/careers/sections",
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName })
      }
    },
    {
      path: `/api/admin/careers/sections/${encodeURIComponent(oldName)}`,
      options: {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      }
    }
  ];

  for (const attempt of attempts) {
    try {
      await request(attempt.path, attempt.options);
      break;
    } catch {
      // fallback to local sync
    }
  }

  const localSections = readLocalCareerSections();
  const updatedSections = normalizeSectionList(
    [...FALLBACK_CAREER_SECTIONS, ...localSections].map((item) =>
      String(item).trim().toLowerCase() === oldLower ? newName : item
    )
  );
  writeLocalCareerSections(updatedSections);

  const localCareers = readLocalCareerCatalog();
  const updatedCareers = localCareers.map((item) => {
    if (String(item.category || "").trim().toLowerCase() !== oldLower) {
      return item;
    }

    return {
      ...item,
      category: newName
    };
  });
  writeLocalCareerCatalog(updatedCareers);

  return updatedSections;
}

export async function deleteCareerSection(sectionName) {
  const name = normalizeText(sectionName);
  if (!name) {
    throw new Error("Section name is required.");
  }

  const nameLower = name.toLowerCase();
  const fallbackCategory = nameLower === "career interest" ? "Technical" : "Career Interest";

  const attempts = [
    {
      path: `/api/admin/careers/sections/${encodeURIComponent(name)}`,
      options: { method: "DELETE" }
    },
    {
      path: `/api/careers/sections/${encodeURIComponent(name)}`,
      options: { method: "DELETE" }
    },
    {
      path: "/api/admin/careers/sections",
      options: {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      }
    }
  ];

  for (const attempt of attempts) {
    try {
      await request(attempt.path, attempt.options);
      break;
    } catch {
      // fallback to local sync
    }
  }

  const localSections = readLocalCareerSections();
  const updatedSections = normalizeSectionList(
    [...FALLBACK_CAREER_SECTIONS, ...localSections].filter(
      (item) => String(item || "").trim().toLowerCase() !== nameLower
    )
  );
  writeLocalCareerSections(updatedSections);

  const localCareers = readLocalCareerCatalog();
  let reassignedCount = 0;
  const reassignedIds = [];
  const updatedCareers = localCareers.map((item) => {
    if (String(item.category || "").trim().toLowerCase() !== nameLower) {
      return item;
    }

    reassignedCount += 1;
    reassignedIds.push(String(item.id));
    return {
      ...item,
      category: fallbackCategory
    };
  });

  writeLocalCareerCatalog(updatedCareers);

  if (!updatedSections.includes(fallbackCategory)) {
    const repaired = normalizeSectionList([...updatedSections, fallbackCategory]);
    writeLocalCareerSections(repaired);
    return {
      sections: repaired,
      reassignedCount,
      reassignedTo: fallbackCategory,
      reassignedFrom: name,
      reassignedIds
    };
  }

  return {
    sections: updatedSections,
    reassignedCount,
    reassignedTo: fallbackCategory,
    reassignedFrom: name,
    reassignedIds
  };
}

function normalizeAdminScoreRow(item, index = 0) {
  if (!item || typeof item !== "object") return null;

  const email = normalizeText(item.email || item.userEmail || item.username || item.user || item.name);
  const category = normalizeText(item.category || item.assessment || item.track || "Unknown");
  const quizTitle = normalizeText(item.quizTitle || item.quizName || item.quiz || "-");
  const score = Number(item.score ?? item.marks ?? item.correctAnswers ?? 0);
  const totalQuestions = Number(item.totalQuestions ?? item.total ?? item.questionCount ?? item.maxScore ?? 0);
  const attemptedAt = normalizeText(item.attemptedAt || item.submittedAt || item.createdAt || item.date || "");

  if (!email && !category && Number.isNaN(score) && Number.isNaN(totalQuestions)) {
    return null;
  }

  return {
    id: item.id ?? `score-${index + 1}`,
    email: email || "Unknown user",
    category,
    quizTitle,
    score: Number.isFinite(score) ? score : 0,
    totalQuestions: Number.isFinite(totalQuestions) ? totalQuestions : 0,
    attemptedAt
  };
}

function normalizeAdminScoreList(data) {
  if (Array.isArray(data)) {
    return data
      .map((item, index) => normalizeAdminScoreRow(item, index))
      .filter(Boolean);
  }

  if (typeof data === "string") {
    const text = data.trim();
    if (!text || text.startsWith("<")) {
      return [];
    }

    try {
      const parsed = JSON.parse(text);
      return normalizeAdminScoreList(parsed);
    } catch {
      return [];
    }
  }

  if (data && typeof data === "object") {
    return normalizeAdminScoreList(
      data.results || data.scores || data.attempts || data.data || []
    );
  }

  return [];
}

function getLocalScoresFallback() {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem("career_attempts");
  const attempts = parseJsonStorage(raw, []);
  if (!Array.isArray(attempts)) return [];

  return attempts
    .map((item, index) =>
      normalizeAdminScoreRow(
        {
          id: item.id ?? `local-attempt-${index + 1}`,
          email: item.email || item.userEmail || "Current user",
          category: item.category,
          quizTitle: item.quizTitle,
          score: item.score,
          totalQuestions: item.totalQuestions,
          attemptedAt: item.submittedAt || item.attemptedAt || item.createdAt
        },
        index
      )
    )
    .filter(Boolean);
}

export async function getAdminScores() {
  const endpoints = [
    "/api/admin/scores",
    "/api/admin/results",
    "/api/results",
    "/legacy/viewScores?format=json",
    "/legacy/viewScores"
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await request(endpoint);
      const normalized = normalizeAdminScoreList(response);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // keep trying endpoints
    }
  }

  return getLocalScoresFallback();
}

export async function promoteUserToAdmin(identifier) {
  const value = normalizeText(identifier);
  if (!value) {
    throw new Error("User email or username is required.");
  }

  const formBody = new URLSearchParams({
    email: value,
    username: value,
    user: value
  }).toString();

  const attempts = [
    {
      path: "/api/admin/users/promote",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value })
      }
    },
    {
      path: "/api/admin/make-admin",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value })
      }
    },
    {
      path: "/legacy/makeAdmin",
      options: {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      }
    },
    {
      path: `/legacy/makeAdmin?${new URLSearchParams({ email: value }).toString()}`,
      options: {
        method: "GET"
      }
    }
  ];

  let lastError = null;

  for (const attempt of attempts) {
    try {
      const response = await request(attempt.path, attempt.options);
      if (response && typeof response === "object" && response.success === false) {
        const message = normalizeText(response.message || response.error) || "Unable to promote user.";
        throw new Error(message);
      }

      return {
        success: true,
        message:
          typeof response === "string"
            ? normalizeText(response) || "User promoted to admin."
            : normalizeText(response?.message || response?.status) || "User promoted to admin."
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || "Unable to promote this user to admin.");
}
