const TRACKS = {
  Personality: {
    high: [
      { title: "Human Resources Specialist", reason: "Strong people understanding and communication." },
      { title: "Career Counselor", reason: "Good fit for guiding individuals and mentoring." },
      { title: "Organizational Development Associate", reason: "Natural alignment with team culture and behavior." }
    ],
    medium: [
      { title: "Customer Success Executive", reason: "Balanced people skills and problem-solving." },
      { title: "Talent Acquisition Coordinator", reason: "Good start for people-focused career growth." },
      { title: "Training Coordinator", reason: "Comfortable in communication and support roles." }
    ],
    low: [
      { title: "Operations Analyst", reason: "Build structure and systems before people-heavy roles." },
      { title: "Documentation Specialist", reason: "Detail-oriented role with clear workflows." },
      { title: "Research Assistant", reason: "Develop confidence through analytical tasks first." }
    ]
  },
  Aptitude: {
    high: [
      { title: "Business Analyst", reason: "Strong numerical and logical decision making." },
      { title: "Data Analyst", reason: "Great base for statistics and data interpretation." },
      { title: "Financial Analyst", reason: "High aptitude supports quantitative finance tracks." }
    ],
    medium: [
      { title: "Operations Executive", reason: "Good analytical ability for process-focused roles." },
      { title: "Project Coordinator", reason: "Can manage tasks and schedules effectively." },
      { title: "MIS Executive", reason: "Practical data handling with business context." }
    ],
    low: [
      { title: "Administrative Associate", reason: "Start with execution-focused responsibility." },
      { title: "Support Coordinator", reason: "Develop quantitative comfort gradually." },
      { title: "Inside Sales Associate", reason: "Communication-first path while building aptitude." }
    ]
  },
  Technical: {
    high: [
      { title: "Software Developer", reason: "Strong technical depth and implementation ability." },
      { title: "QA Automation Engineer", reason: "Great fit for technical precision and testing." },
      { title: "Cloud Engineer", reason: "High potential for modern infrastructure roles." }
    ],
    medium: [
      { title: "Frontend Developer", reason: "Good practical coding base with visual output." },
      { title: "Technical Support Engineer", reason: "Blend technical troubleshooting and communication." },
      { title: "Junior Full Stack Developer", reason: "Balanced learning path across backend/frontend." }
    ],
    low: [
      { title: "IT Operations Associate", reason: "Build technical fundamentals in structured environments." },
      { title: "Manual QA Tester", reason: "Entry route to software lifecycle and quality." },
      { title: "Tech Documentation Writer", reason: "Technical exposure with lower coding intensity." }
    ]
  },
  Logical: {
    high: [
      { title: "Data Engineer", reason: "Excellent fit for structured thinking and system design." },
      { title: "Product Analyst", reason: "Strong logic for decision-oriented product insights." },
      { title: "Cybersecurity Analyst", reason: "Pattern detection and reasoning are key strengths." }
    ],
    medium: [
      { title: "Process Analyst", reason: "Solid potential in process improvements and workflow." },
      { title: "Business Operations Analyst", reason: "Good role for problem decomposition practice." },
      { title: "Quality Analyst", reason: "Logical review and validation oriented responsibilities." }
    ],
    low: [
      { title: "Coordinator Roles", reason: "Develop logic through execution and routine planning." },
      { title: "Client Support Specialist", reason: "Step into structured issue-solving gradually." },
      { title: "Content Operations Associate", reason: "Process-based work to strengthen analytical flow." }
    ]
  },
  "Career Interest": {
    high: [
      { title: "Career Planning Consultant", reason: "Strong clarity in interests and direction." },
      { title: "Domain Specialist Track", reason: "Ready to pick and deepen in a chosen field." },
      { title: "Graduate Program Candidate", reason: "Suitable for accelerated professional pathways." }
    ],
    medium: [
      { title: "Multi-domain Internship", reason: "Explore 1-2 tracks before final specialization." },
      { title: "Associate Program", reason: "Structured exposure across functions fits well." },
      { title: "Entry-level Specialist", reason: "Start focused role while validating long-term interest." }
    ],
    low: [
      { title: "Career Exploration Program", reason: "Prioritize awareness through projects and mentorship." },
      { title: "Foundation Certification Path", reason: "Build confidence with short structured courses." },
      { title: "Generalist Role", reason: "Gain broad exposure before committing to a niche." }
    ]
  }
};

function getBand(score, totalQuestions) {
  const ratio = totalQuestions > 0 ? score / totalQuestions : 0;
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.45) return "medium";
  return "low";
}

export function getCareerRecommendations({ category, score, totalQuestions }) {
  const tracks = TRACKS[category] || TRACKS["Career Interest"];
  const band = getBand(score, totalQuestions);
  return tracks[band] || [];
}