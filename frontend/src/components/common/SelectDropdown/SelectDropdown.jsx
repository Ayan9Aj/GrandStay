import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '../Icons';
import './SelectDropdown.css';

export default function SelectDropdown({ id, value, options, onChange, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 12, left: 12, width: 220 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return undefined;
    const placePanel = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 24);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const panelHeight = Math.min(options.length * 44 + 16, window.innerHeight - 24);
      const top = rect.bottom + 8 + panelHeight <= window.innerHeight
        ? rect.bottom + 8
        : Math.max(12, rect.top - panelHeight - 8);
      setPosition({ top, left, width });
    };
    const onPointerDown = (event) => {
      if (!panelRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpen(false);
    };
    const onEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    placePanel();
    optionRefs.current[selectedIndex]?.focus();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', placePanel);
    window.addEventListener('scroll', placePanel, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', placePanel);
      window.removeEventListener('scroll', placePanel, true);
    };
  }, [open, options.length, selectedIndex]);

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleOptionKeyDown = (event, index) => {
    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = Math.min(options.length - 1, index + 1);
    else if (event.key === 'ArrowUp') nextIndex = Math.max(0, index - 1);
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else return;
    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  };

  const panel = open && createPortal(
    <div
      id={`${id}-listbox`}
      ref={panelRef}
      className="select-dropdown__panel"
      role="listbox"
      aria-label={ariaLabel}
      style={{ position: 'fixed', top: position.top, left: position.left, width: position.width, zIndex: 600 }}
      onBlur={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget)
          && !triggerRef.current?.contains(event.relatedTarget)
        ) setOpen(false);
      }}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(element) => { optionRefs.current[index] = element; }}
          type="button"
          role="option"
          aria-selected={option.value === value}
          className="select-dropdown__option"
          onClick={() => selectOption(option)}
          onKeyDown={(event) => handleOptionKeyDown(event, index)}
        >
          {option.label}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className={`select-dropdown__trigger ${className}`.trim()}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="select-dropdown__value">{selectedOption?.label || value}</span>
        <ChevronDownIcon size={16} />
      </button>
      {panel}
    </>
  );
}
