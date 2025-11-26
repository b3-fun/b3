import { SVGProps } from "react";

const LockIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M14.1667 9.16667V6.66667C14.1667 4.36548 12.3012 2.5 10 2.5C7.69881 2.5 5.83333 4.36548 5.83333 6.66667V9.16667M7.5 14.1667C7.5 15.0871 8.24619 15.8333 9.16667 15.8333H10.8333C11.7538 15.8333 12.5 15.0871 12.5 14.1667C12.5 13.2462 11.7538 12.5 10.8333 12.5H9.16667C8.24619 12.5 7.5 11.7538 7.5 10.8333C7.5 9.91286 8.24619 9.16667 9.16667 9.16667H10.8333C11.7538 9.16667 12.5 9.91286 12.5 10.8333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LockIcon;
