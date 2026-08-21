import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const flipVariants = {
  top: {
    initial: { opacity: 0, rotateX: 90, scale: 0.9, y: "-50%", x: "-50%" },
    animate: { opacity: 1, rotateX: 0, scale: 1, y: "-50%", x: "-50%" },
    exit: { opacity: 0, rotateX: 90, scale: 0.9, y: "-50%", x: "-50%" }
  },
  bottom: {
    initial: { opacity: 0, rotateX: -90, scale: 0.9, y: "-50%", x: "-50%" },
    animate: { opacity: 1, rotateX: 0, scale: 1, y: "-50%", x: "-50%" },
    exit: { opacity: 0, rotateX: -90, scale: 0.9, y: "-50%", x: "-50%" }
  },
  left: {
    initial: { opacity: 0, rotateY: -90, scale: 0.9, y: "-50%", x: "-50%" },
    animate: { opacity: 1, rotateY: 0, scale: 1, y: "-50%", x: "-50%" },
    exit: { opacity: 0, rotateY: -90, scale: 0.9, y: "-50%", x: "-50%" }
  },
  right: {
    initial: { opacity: 0, rotateY: 90, scale: 0.9, y: "-50%", x: "-50%" },
    animate: { opacity: 1, rotateY: 0, scale: 1, y: "-50%", x: "-50%" },
    exit: { opacity: 0, rotateY: 90, scale: 0.9, y: "-50%", x: "-50%" }
  }
}

const AlertDialogContent = React.forwardRef(({ className, from = "bottom", children, ...props }, ref) => {
  const variant = flipVariants[from] || flipVariants.bottom

  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content asChild ref={ref} {...props}>
        <motion.div
          initial={variant.initial}
          animate={variant.animate}
          exit={variant.exit}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className={cn(
            "fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg gap-4 border border-border bg-card p-6 shadow-2xl sm:rounded-2xl",
            className
          )}
          style={{ perspective: 1000, transformStyle: "preserve-3d" }}
        >
          {children}
        </motion.div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-bold text-foreground", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn("inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors", className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn("mt-2 inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors sm:mt-0", className)}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
