"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";

import { useIsMobile } from "./use-mobile";
import { cn } from "./utils";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const SkeletonButton = () => {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
};

const TooltipButton = React.forwardRef(
  ({ children, className, variant, size, ...props }, ref) => {
    const isMobile = useIsMobile();
    const Comp = isMobile ? Button : TooltipTrigger;

    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          "group flex w-full items-center justify-between",
          className
        )}
        {...props}
      >
        {children}
        <Slot className="ml-auto h-4 w-4 opacity-0 transition-all group-hover:ml-2 group-hover:opacity-100">
          <PanelLeftIcon className="h-4 w-4" />
        </Slot>
      </Comp>
    );
  }
);
TooltipButton.displayName = "TooltipButton";

const SheetDemo = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Sheet Title</SheetTitle>
          <SheetDescription>
            This is a description for the sheet. It can contain multiple lines
            of text.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="grid gap-4 py-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover or focus me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is some tooltip content!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { SheetDemo, TooltipButton };