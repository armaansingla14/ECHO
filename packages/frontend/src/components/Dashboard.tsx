import React, { useState, useEffect } from 'react';
import CalendarIcon from '../assets/Calendar.svg';
import { fetchEvents, Event } from '../services/api';

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch events whenever the selected date changes
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const data = await fetchEvents(selectedDate);
      setEvents(data);
      setLoading(false);
    };
    loadEvents();
  }, [selectedDate]);

  // Calculate stats from events
  const getStats = () => {
    if (events.length === 0) {
      return { hours: 0, projects: 0, files: 0 };
    }

    // Calculate active time (in hours)
    const timestamps = events.map(e => e.timestamp.getTime());
    const firstEvent = Math.min(...timestamps);
    const lastEvent = Math.max(...timestamps);
    const hours = Math.round((lastEvent - firstEvent) / (1000 * 60 * 60 * 10)) / 10; // Round to 1 decimal

    // Count unique projects and files
    const uniqueFiles = new Set(events.filter(e => e.type.includes('file')).map(e => e.text));
    const uniqueProjects = new Set(events.map(e => e.source));

    return {
      hours: hours || 0,
      projects: uniqueProjects.size,
      files: uniqueFiles.size
    };
  };

  const stats = getStats();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="dashboard card flex flex-col gap-6" style={{ flex: 1, overflowY: 'auto' }}>
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        <h2 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em' }}>Today's Summary</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          {events.length > 0 ? (
            <>
              You spent <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{stats.hours} hours</span> working across {stats.projects} project{stats.projects !== 1 ? 's' : ''}, tracking {events.length} event{events.length !== 1 ? 's' : ''}
            </>
          ) : (
            loading ? 'Loading events...' : 'No activity recorded for this day'
          )}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="flex flex-col gap-4">
        <h3 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em' }}>Quick Stats</h3>
        <div className="flex gap-4">
          <StatCard value={`${stats.hours} Hours`} label="Active" />
          <StatCard value={`${stats.projects} Project${stats.projects !== 1 ? 's' : ''}`} label="Worked on" />
          <StatCard value={`${stats.files} Files`} label="Edited" />
        </div>
      </div>

      {/* Activity Section */}
      <div className="flex flex-col gap-4" style={{ flex: 1 }}>
        <h3 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.01em' }}>Activity</h3>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            borderRadius: '9999px',
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.03)'
          }}>
            <img src={CalendarIcon} alt="Calendar" width="24" height="24" />
            <span style={{ fontSize: '18px', fontWeight: 500 }}>{formatDate(selectedDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousDay}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
              style={{ 
                cursor: 'pointer', 
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderRadius: '9999px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button 
              onClick={goToToday}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
              style={{ 
                cursor: 'pointer', 
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderRadius: '9999px',
                padding: '8px 16px',
                color: 'var(--text-primary)', 
                fontSize: '14px', 
                fontWeight: 500, 
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.2s ease'
              }}>
              <span>Today</span>
            </button>
            <button 
              onClick={goToNextDay}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
              style={{ 
                cursor: 'pointer', 
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.03)',
                borderRadius: '9999px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
              Loading...
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
              No events recorded for this day
            </div>
          ) : (
            events.slice(0, 10).map((event, idx) => (
              <ActivityItem 
                key={idx}
                time={event.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                title={event.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                description={event.text.length > 60 ? event.text.substring(0, 60) + '...' : event.text}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ value, label }: { value: string, label: string }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div 
      className="card flex flex-col gap-2 items-center justify-center text-center" 
      style={{ 
        flex: 1,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? 'inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(255, 255, 255, 0.1), 0 8px 16px rgba(0, 0, 0, 0.4)'
          : 'inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: '20px', fontWeight: 600 }}>{value}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
};

const ActivityItem = ({ time, title, description }: { time: string, title: string, description: string }) => (
  <div className="flex gap-4" style={{ position: 'relative' }}>
    <div className="flex items-center gap-2" style={{ minWidth: '90px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{time}</span>
    </div>
    <div className="flex flex-col gap-1.5" style={{ 
      borderLeft: '2px solid rgba(96, 165, 250, 0.3)', 
      paddingLeft: '20px',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        left: '-5px',
        top: '6px',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#60A5FA',
        boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)'
      }}></div>
      <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{description}</span>
    </div>
  </div>
);

// Icons
const ArrowLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
);
const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);

export default Dashboard;
