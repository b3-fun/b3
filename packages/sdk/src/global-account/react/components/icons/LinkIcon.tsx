import { SVGProps } from "react";

const LinkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M10.8333 9.16667L15.8333 4.16667M17.5 2.5L15.8333 4.16667L17.5 2.5ZM11.6667 4.16667H15.8333V8.33333L11.6667 4.16667ZM9.16667 10.8333L4.16667 15.8333L9.16667 10.8333ZM8.33333 15.8333H4.16667V11.6667L8.33333 15.8333ZM15.8333 10V15.8333H10L15.8333 10ZM4.16667 4.16667V10L10 4.16667H4.16667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LinkIcon;
