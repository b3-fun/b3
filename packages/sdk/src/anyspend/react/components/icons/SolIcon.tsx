export function SolIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        fill="url(#SOL__a)"
        d="M18.413 7.903a.62.62 0 0 1-.411.164H3.58c-.512 0-.77-.585-.416-.929l2.368-2.283a.6.6 0 0 1 .41-.169h14.479c.517 0 .77.59.41.934z"
      />
      <path
        fill="url(#SOL__b)"
        d="M18.413 19.157a.6.6 0 0 1-.411.157H3.58c-.512 0-.77-.58-.416-.923l2.368-2.289a.6.6 0 0 1 .41-.163h14.479c.517 0 .77.585.41.928z"
      />
      <path
        fill="url(#SOL__c)"
        d="M18.413 10.472a.6.6 0 0 0-.411-.158H3.58c-.512 0-.77.58-.416.922l2.368 2.29a.62.62 0 0 0 .41.163h14.479c.517 0 .77-.585.41-.928z"
      />
      <defs>
        <linearGradient id="SOL__a" x1="3.001" x2="21.431" y1="16.322" y2="15.591" gradientUnits="userSpaceOnUse">
          <stop stopColor="#599DB0" />
          <stop offset="1" stopColor="#47F8C3" />
        </linearGradient>
        <linearGradient id="SOL__b" x1="3.001" x2="21.323" y1="16.973" y2="16.366" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C44FE2" />
          <stop offset="1" stopColor="#73B0D0" />
        </linearGradient>
        <linearGradient id="SOL__c" x1="4.035" x2="20.302" y1="12.002" y2="12.002" gradientUnits="userSpaceOnUse">
          <stop stopColor="#778CBF" />
          <stop offset="1" stopColor="#5DCDC9" />
        </linearGradient>
      </defs>
    </svg>
  );
}
