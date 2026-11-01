import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon } from '../Icons';
import './DateRangePicker.css';

const padNumber = (number) => String(number).padStart(2, '0');
const dateToKey = (date) => `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
const todayKey = dateToKey(new Date());
const dateFromKey = (value) => new Date(`${value}T12:00:00`);
const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1, 12);
const displayDate = (value) => value
  ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateFromKey(value))
  : '';
const displayMonth = (date) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);

const getMonthDays = (month) => {
  const firstWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return null;
    return new Date(month.getFullYear(), month.getMonth(), day, 12);
  });
};

function CalendarPanel({ id, viewMonth, dates, onMonthChange, onDateSelect, calendarRef, showTwoMonths }) {
  const months = [viewMonth, new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1, 12)];
  const weekdayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div id={id} ref={calendarRef} className="hero-calendar" role="dialog" aria-label="Choose check-in and check-out dates">
      <div className="hero-calendar__toolbar">
        <button type="button" className="hero-calendar__month-nav" aria-label="Previous month" onClick={() => onMonthChange(-1)}>
          <span aria-hidden="true">‹</span>
        </button>
        <span className="hero-calendar__range-title">
          {showTwoMonths ? `${displayMonth(months[0])} – ${displayMonth(months[1])}` : displayMonth(months[0])}
        </span>
        <button type="button" className="hero-calendar__month-nav" aria-label="Next month" onClick={() => onMonthChange(1)}>
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className={`hero-calendar__months ${showTwoMonths ? '' : 'is-single'}`}>
        {months.map((month) => (
          <section className="hero-calendar__month" key={`${month.getFullYear()}-${month.getMonth()}`} aria-label={displayMonth(month)}>
            <h3 className="hero-calendar__month-title">{displayMonth(month)}</h3>
            <div className="hero-calendar__grid hero-calendar__weekdays" aria-hidden="true">
              {weekdayNames.map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="hero-calendar__grid hero-calendar__days">
              {getMonthDays(month).map((day, index) => {
                if (!day) return <span className="hero-calendar__empty-day" key={`empty-${index}`} />;
                const key = dateToKey(day);
                const isStart = key === dates.checkIn;
                const isEnd = key === dates.checkOut;
                const isBetween = Boolean(dates.checkIn && dates.checkOut && key > dates.checkIn && key < dates.checkOut);
                const isDisabled = key < todayKey;
                const dayClasses = [
                  'hero-calendar__day',
                  isStart ? 'is-range-start' : '',
                  isEnd ? 'is-range-end' : '',
                  isBetween ? 'is-in-range' : '',
                  isDisabled ? 'is-disabled' : ''
                ].filter(Boolean).join(' ');

                return (
                  <button
                    type="button"
                    className={dayClasses}
                    key={key}
                    disabled={isDisabled}
                    aria-label={new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' }).format(day)}
                    aria-pressed={isStart || isEnd}
                    onClick={() => onDateSelect(key)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <p className="hero-calendar__hint">Choose a check-in date, then a check-out date</p>
    </div>
  );
}

export default function DateRangePicker({
  dates,
  onChange,
  id,
  label = 'Check-in / Check-out',
  triggerClassName = '',
  valueClassName = '',
  showIcon = true,
  ariaDescribedBy,
  ariaInvalid = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftDates, setDraftDates] = useState(dates);
  const [viewMonth, setViewMonth] = useState(() => monthStart(dateFromKey(dates.checkIn || todayKey)));
  const [calendarPosition, setCalendarPosition] = useState({ top: 12, left: 12 });
  const [showTwoMonths, setShowTwoMonths] = useState(() => window.innerWidth > 700);
  const generatedId = useId();
  const calendarRef = useRef(null);
  const triggerRef = useRef(null);
  const triggerId = id || `date-range-${generatedId.replace(/:/g, '')}`;
  const calendarId = `${triggerId}-calendar`;

  useEffect(() => {
    if (!isOpen) return undefined;
    const placeCalendar = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const panelWidth = Math.min(680, window.innerWidth - 24);
      const left = Math.min(Math.max(12, anchor.left), window.innerWidth - panelWidth - 12);
      const top = anchor.bottom + 8 + 360 > window.innerHeight
        ? Math.max(12, anchor.top - 368)
        : anchor.bottom + 8;
      setCalendarPosition({ top, left });
    };
    const onPointerDown = (event) => {
      if (!calendarRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const onResize = () => {
      setShowTwoMonths(window.innerWidth > 700);
      placeCalendar();
    };
    placeCalendar();
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', placeCalendar, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', placeCalendar, true);
    };
  }, [isOpen]);

  const openCalendar = (event) => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setDraftDates(dates);
    setShowTwoMonths(window.innerWidth > 700);
    triggerRef.current = event.currentTarget;
    setViewMonth(monthStart(dateFromKey(dates.checkIn || todayKey)));
    setIsOpen(true);
  };

  const handleDateSelect = (selectedDate) => {
    const nextDates = !draftDates.checkIn || draftDates.checkOut || selectedDate <= draftDates.checkIn
      ? { checkIn: selectedDate, checkOut: '' }
      : { ...draftDates, checkOut: selectedDate };
    setDraftDates(nextDates);
    onChange(nextDates);
    if (nextDates.checkOut) setIsOpen(false);
  };

  const calendar = isOpen && createPortal(
    <div style={{ position: 'fixed', top: calendarPosition.top, left: calendarPosition.left, zIndex: 600 }}>
      <CalendarPanel
        id={calendarId}
        viewMonth={viewMonth}
        dates={draftDates}
        onMonthChange={(offset) => setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1, 12))}
        onDateSelect={handleDateSelect}
        calendarRef={calendarRef}
        showTwoMonths={showTwoMonths}
      />
    </div>,
    document.body
  );
  const displayedDates = isOpen ? draftDates : dates;

  return (
    <>
      <button
        type="button"
        id={triggerId}
        ref={triggerRef}
        className={triggerClassName}
        aria-haspopup="dialog"
        aria-controls={calendarId}
        aria-expanded={isOpen}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid || undefined}
        aria-label={`${label}: ${displayDate(displayedDates.checkIn) || 'not selected'}${displayedDates.checkOut ? ` to ${displayDate(displayedDates.checkOut)}` : ''}. Open calendar`}
        onClick={openCalendar}
      >
        {showIcon && <CalendarIcon size={16} />}
        <span className={valueClassName}>
          {displayedDates.checkIn ? `${displayDate(displayedDates.checkIn)}${displayedDates.checkOut ? ` – ${displayDate(displayedDates.checkOut)}` : ' – Select check-out'}` : 'Select check-in and check-out'}
        </span>
      </button>
      {calendar}
    </>
  );
}
