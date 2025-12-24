import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="hsl(var(--primary))" stroke="none" />
      <path d="M15.5 7.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h.5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-.5z" fill="hsl(var(--primary-foreground))" stroke="none"/>
      <path d="M8.5 7.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h.5a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-.5z" fill="hsl(var(--primary-foreground))" stroke="none" transform="rotate(180 12 12)" />
      <path d="M12 5a7 7 0 0 0-7 7" stroke="hsl(var(--accent))" strokeWidth="2.5" />
    </svg>
  ),
};
