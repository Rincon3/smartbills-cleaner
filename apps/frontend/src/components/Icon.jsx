const icons = {
  dashboard: (
    <path d="M4 13h7V4H4zm9 7h7V11h-7zM4 20h7v-5H4zm9-9h7V4h-7z" fill="currentColor" />
  ),
  invoices: (
    <path
      d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm7 1.5V9h4.5"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  upload: (
    <path
      d="M12 16V5m0 0l-4 4m4-4l4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  users: (
    <path
      d="M16 19a4 4 0 0 0-8 0m12 0a3 3 0 0 0-5-2.24M16 5.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm5 3a2.5 2.5 0 1 1-5 0"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  audit: (
    <path
      d="M4 18h4l3-7 3 5 2-3 4 5M4 6h4m2 0h10M4 10h8"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  settings: (
    <path
      d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8 3.5-.92-.53.09-1.06a1 1 0 0 0-.68-1l-1.02-.35-.38-.99a1 1 0 0 0-1.02-.6l-1.06.1-.7-.8a1 1 0 0 0-1.13-.27L12 6l-.98-.5a1 1 0 0 0-1.14.28l-.7.8-1.05-.1a1 1 0 0 0-1.03.6l-.38.98-1.02.36a1 1 0 0 0-.67 1l.08 1.06L4 12l.51.92-.08 1.06a1 1 0 0 0 .67 1l1.02.35.38.99a1 1 0 0 0 1.03.6l1.05-.1.7.8a1 1 0 0 0 1.14.27L12 18l.99.5a1 1 0 0 0 1.13-.28l.7-.8 1.06.1a1 1 0 0 0 1.02-.6l.38-.98 1.02-.36a1 1 0 0 0 .68-1l-.1-1.06z"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  bell: (
    <path
      d="M9 21a3 3 0 0 0 6 0m-8-4h10l-1-2v-4a4 4 0 1 0-8 0v4l-1 2z"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  help: (
    <path
      d="M12 18h.01M9.4 9a2.6 2.6 0 1 1 4.96 1.1c-.4.62-.98.96-1.36 1.34-.39.39-.63.77-.63 1.56"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  logout: (
    <path
      d="M15 8l5 4-5 4M20 12H9m6 8H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  search: (
    <path
      d="m21 21-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0z"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  consult: (
    <path
      d="M5 5h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm14 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1v2l-3-2"
      stroke="currentColor"
      strokeWidth="1.7"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  more: (
    <path
      d="M12 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 5.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"
      fill="currentColor"
    />
  )
};

export function Icon({ name, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

