import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TabsContext = React.createContext({
  value: undefined,
  onValueChange: () => {},
});

export const Tabs = React.forwardRef(({ value, defaultValue, onValueChange, children, className, ...props }, ref) => {
  const [currentValue, setCurrentValue] = React.useState(value || defaultValue);

  const handleValueChange = (newVal) => {
    setCurrentValue(newVal);
    if (onValueChange) onValueChange(newVal);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <TabsPrimitive.Root
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </TabsPrimitive.Root>
    </TabsContext.Provider>
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName;

export const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn("flex items-center justify-center rounded-lg p-1", className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsHighlight = ({ className, children }) => {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  );
};

export const TabsHighlightItem = ({ value, className, children }) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isActive = selectedValue === value;

  return (
    <div className={cn("relative", className)}>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-primary/20 border border-primary/50 shadow-sm"
          style={{ borderRadius: 9 }}
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <div className="relative z-10 w-full h-full flex">
        {children}
      </div>
    </div>
  );
};

export const TabsTrigger = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isActive = selectedValue === value;
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className
      )}
      style={{ borderRadius: 9, letterSpacing: '0.04em', textTransform: 'uppercase' }}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContents = ({ className, children }) => {
  return (
    <div className={cn("mt-4 relative", className)}>
      {children}
    </div>
  );
};

export const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue } = React.useContext(TabsContext);
  const isActive = selectedValue === value;
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="w-full h-full"
        >
          <TabsPrimitive.Content
            forceMount
            ref={ref}
            value={value}
            className={cn("focus-visible:outline-none w-full", className)}
            {...props}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;
