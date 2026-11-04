/**
 * Central site configuration: brand, navigation, categories, states and
 * footer links. This is navigational/structural content — not opportunity
 * data. No counts, stats or notification numbers live here (those must come
 * from verified records only).
 */

export const site = {
  name: "AvsarPath",
  tagline: "Find and track Indian exams, jobs and opportunities",
  description:
    "AvsarPath is an independent platform that helps students, graduates and job seekers across India discover government jobs, exams, admissions and scholarships — with official sources and verified dates.",
  // Independent platform — NOT a government website.
  independenceNotice:
    "AvsarPath is an independent information platform and is not affiliated with UPSC, SSC, BPSC, Railway Recruitment Boards or any government authority.",
};

export const primaryNav: { label: string; href: string }[] = [
  { label: "Opportunities", href: "/opportunities" },
  { label: "Exam Calendar", href: "/calendar" },
  { label: "Results", href: "/results" },
  { label: "Admit Cards", href: "/admit-cards" },
  { label: "Eligibility Finder", href: "/eligibility" },
];

/**
 * Top-level categories for the v1 focus (central government + Bihar state).
 * Used for navigation and "popular categories" links. The database is the
 * source of truth once populated; these are structural entry points.
 */
export const categories: { label: string; slug: string }[] = [
  { label: "UPSC", slug: "upsc" },
  { label: "SSC", slug: "ssc" },
  { label: "Banking", slug: "banking" },
  { label: "Railways", slug: "railways" },
  { label: "Defence", slug: "defence" },
  { label: "State PSC (BPSC)", slug: "state-psc" },
  { label: "Entrance Exams", slug: "entrance-exams" },
  { label: "Scholarships", slug: "scholarships" },
];

/** Qualification levels for the eligibility/discovery entry points. */
export const qualifications: { label: string; slug: string }[] = [
  { label: "10th Pass", slug: "10th" },
  { label: "12th Pass", slug: "12th" },
  { label: "ITI", slug: "iti" },
  { label: "Diploma", slug: "diploma" },
  { label: "Graduate", slug: "graduate" },
  { label: "Postgraduate", slug: "postgraduate" },
];

/** v1 geographic entry points: all-India (central) plus Bihar. */
export const regions: { label: string; slug: string }[] = [
  { label: "All India / Central", slug: "central" },
  { label: "Bihar", slug: "bihar" },
];

export const footerLinks: { label: string; href: string }[] = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];
