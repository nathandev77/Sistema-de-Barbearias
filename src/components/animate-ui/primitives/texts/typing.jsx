import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

export const TypingTextCursor = ({ className }) => {
    return (
        <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{
                repeat: Infinity,
                duration: 0.8,
                ease: "linear"
            }}
            className={cn("inline-block w-0.5 h-full bg-current align-middle ml-1", className)}
        />
    );
};

export const TypingText = ({
    text,
    className,
    delay = 0,
    holdDelay = 2000,
    loop = false,
    children
}) => {
    const [isTyping, setIsTyping] = useState(true);
    const controls = useAnimation();
    const characters = text.split('');

    useEffect(() => {
        let timeout;

        const animate = async () => {
            setIsTyping(true);
            await controls.start(i => ({
                opacity: 1,
                display: "inline",
                transition: { delay: delay + i * 0.05 }
            }));
            
            setIsTyping(false);

            if (loop) {
                timeout = setTimeout(async () => {
                    await controls.start({
                        opacity: 0,
                        display: "none",
                        transition: { duration: 0 }
                    });
                    animate();
                }, holdDelay);
            }
        };

        animate();

        return () => clearTimeout(timeout);
    }, [controls, delay, holdDelay, loop]);

    return (
        <span className={cn("inline-block", className)}>
            {characters.map((char, index) => (
                <motion.span
                    key={`${index}-${char}`}
                    custom={index}
                    animate={controls}
                    initial={{ opacity: 0, display: "none" }}
                    className="inline-block"
                    style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
                >
                    {char}
                </motion.span>
            ))}
            {children}
        </span>
    );
};
