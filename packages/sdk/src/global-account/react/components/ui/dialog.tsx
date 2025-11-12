"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@b3dotfun/sdk/shared/utils";

const Dialog: typeof DialogPrimitive.Root = DialogPrimitive.Root;

const DialogTrigger: typeof DialogPrimitive.Trigger = DialogPrimitive.Trigger;

const DialogPortal: typeof DialogPrimitive.Portal = DialogPrimitive.Portal;

const DialogClose: typeof DialogPrimitive.Close = DialogPrimitive.Close;

type DialogOverlayElement = React.ElementRef<typeof DialogPrimitive.Overlay>;
type DialogOverlayProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;

const DialogOverlay: React.ForwardRefExoticComponent<DialogOverlayProps & React.RefAttributes<DialogOverlayElement>> =
  React.forwardRef<DialogOverlayElement, DialogOverlayProps>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-[20px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:backdrop-blur-none data-[state=open]:backdrop-blur-[20px]",
        "transition-all duration-300",
        className,
      )}
      {...props}
    />
  ));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentElement = React.ElementRef<typeof DialogPrimitive.Content>;
type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  hideCloseButton?: boolean;
  closeBtnClassName?: string;
};

const DialogContent: React.ForwardRefExoticComponent<DialogContentProps & React.RefAttributes<DialogContentElement>> =
  React.forwardRef<DialogContentElement, DialogContentProps>(
    ({ className, children, hideCloseButton = false, closeBtnClassName, ...props }, ref) => {
      const container = typeof window !== "undefined" ? document.getElementById("b3-root") : null;
      return (
        <DialogPortal container={container}>
          <DialogOverlay />
          <DialogPrimitive.Content
            ref={ref}
            className={cn(
              "fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 border shadow-lg !outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-500",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
              "[perspective:1200px] [transform-style:preserve-3d] sm:rounded-xl",
              "transition-all ease-out",
              className,
            )}
            {...props}
          >
            <div className="bg-b3-react-background flex flex-1 flex-col overflow-hidden rounded-xl border border-[#D1D1D6] bg-white shadow-[0_20px_24px_-4px_rgba(10,13,18,0.08),0_8px_8px_-4px_rgba(10,13,18,0.03),0_3px_3px_-1.5px_rgba(10,13,18,0.04)]">
              {children}
              {!hideCloseButton && (
                <DialogPrimitive.Close
                  className={cn(
                    "modal-close-button data-[state=open]:bg-b3-react-background data-[state=open]:text-b3-react-muted-foreground absolute right-2 top-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400",
                    closeBtnClassName,
                  )}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
              )}
            </div>
            {/* Global Account Footer */}
            <div className="flex items-center justify-center gap-1.5 pt-[10px]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 4.66667C2 3.19391 3.19391 2 4.66667 2H11.3333C12.8061 2 14 3.19391 14 4.66667V11.3333C14 12.8061 12.8061 14 11.3333 14H4.66667C3.19391 14 2 12.8061 2 11.3333V4.66667Z"
                  fill="#0B57C2"
                />
                <path
                  d="M5.33333 6C5.33333 5.63181 5.63181 5.33333 6 5.33333H10C10.3682 5.33333 10.6667 5.63181 10.6667 6V10C10.6667 10.3682 10.3682 10.6667 10 10.6667H6C5.63181 10.6667 5.33333 10.3682 5.33333 10V6Z"
                  fill="white"
                />
              </svg>
              <span className="font-neue-montreal-semibold text-xs uppercase leading-none tracking-[0.72px] text-[#0B57C2]">
                Global Account
              </span>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      );
    },
  );
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

type DialogTitleElement = React.ElementRef<typeof DialogPrimitive.Title>;
type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

const DialogTitle: React.ForwardRefExoticComponent<DialogTitleProps & React.RefAttributes<DialogTitleElement>> =
  React.forwardRef<DialogTitleElement, DialogTitleProps>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

type DialogDescriptionElement = React.ElementRef<typeof DialogPrimitive.Description>;
type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

const DialogDescription: React.ForwardRefExoticComponent<
  DialogDescriptionProps & React.RefAttributes<DialogDescriptionElement>
> = React.forwardRef<DialogDescriptionElement, DialogDescriptionProps>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-b3-react-muted-foreground text-sm", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
