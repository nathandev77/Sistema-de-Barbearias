import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Select({ 
    value, 
    onChange, 
    options, 
    className = '', 
    triggerClassName = '', 
    menuClassName = '',
    placeholder = 'Selecione...'
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const ref = useRef(null);
    const menuRef = useRef(null);

    const updatePosition = () => {
        if (ref.current && isOpen) {
            const rect = ref.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX + rect.width / 2,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (ref.current && !ref.current.contains(event.target)) {
                if (menuRef.current && !menuRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    const menu = isOpen ? createPortal(
        <div 
            ref={menuRef}
            className={`absolute z-[9999] mt-1 min-w-[140px] bg-[#1a1d24] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${menuClassName}`}
            style={{ 
                top: `${coords.top}px`, 
                left: `${coords.left}px`, 
                transform: 'translateX(-50%)' 
            }}
        >
            {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(opt.value);
                            setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors
                            ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-white/5 hover:text-white'}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            {opt.renderOption ? opt.renderOption() : opt.label}
                        </div>
                        {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </button>
                );
            })}
        </div>,
        document.body
    ) : null;

    return (
        <div className={`relative inline-block text-left ${className}`} ref={ref}>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center justify-between w-full focus:outline-none transition-colors ${triggerClassName}`}
            >
                <span className="truncate mr-2">
                    {selectedOption ? (selectedOption.renderLabel ? selectedOption.renderLabel() : selectedOption.label) : placeholder}
                </span>
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`w-3.5 h-3.5 opacity-70 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {menu}
        </div>
    );
}
