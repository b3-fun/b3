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
              "bg-b3-react-background fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg !outline-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-500",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
              "[perspective:1200px] [transform-style:preserve-3d] sm:rounded-xl",
              "transition-all ease-out",
              className,
            )}
            {...props}
          >
            {children}
            {!hideCloseButton && (
              <DialogPrimitive.Close
                className={cn(
                  "data-[state=open]:bg-b3-react-background data-[state=open]:text-b3-react-muted-foreground absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none dark:data-[state=open]:bg-gray-800 dark:data-[state=open]:text-gray-400",
                  closeBtnClassName,
                )}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
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
