import React, { useState, useEffect } from 'react';
import EchoLogo from '../assets/ECHO.svg';
import HomeIcon from '../assets/Home.svg';
import ActivityIcon from '../assets/Activity.svg';
import SearchIcon from '../assets/Search.svg';
import FolderIcon from '../assets/Folder.svg';
import SettingsIcon from '../assets/Settings.svg';
import UserIcon from '../assets/User.svg';
import ClockIcon from '../assets/Clock.svg';
import { fetchTodayEvents, Event } from '../services/api';

const Sidebar = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      const data = await fetchTodayEvents();
      setEvents(data);
    };
    
    loadEvents();
    
    // Refresh events every minute
    const refreshTimer = setInterval(loadEvents, 60000);
    return () => clearInterval(refreshTimer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get latest event info
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;
  const currentFile = latestEvent?.text || 'No file active';
  const currentProject = latestEvent?.source || 'No project';
  
  // Calculate time spent (hours)
  const getTimeSpent = () => {
    if (events.length === 0) return 0;
    const timestamps = events.map(e => new Date(e.timestamp).getTime());
    const firstEvent = Math.min(...timestamps);
    const lastEvent = Math.max(...timestamps);
    const hours = (lastEvent - firstEvent) / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10;
  };

  const timeSpent = getTimeSpent();
  const progressPercent = Math.min((timeSpent / 8) * 100, 100); // Out of 8 hour workday

  // Get "time ago" for last event
  const getTimeAgo = () => {
    if (!latestEvent) return 'Never';
    const now = new Date().getTime();
    const eventTime = new Date(latestEvent.timestamp).getTime();
    const diff = Math.floor((now - eventTime) / 1000); // seconds
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  return (
    <div className="sidebar flex flex-col justify-between" style={{ width: '280px', height: '100%', flexShrink: 0 }}>
      {/* Top Section */}
      <div className="card flex flex-col gap-4" style={{ flex: 1, marginBottom: '16px' }}>
        <div style={{ width: '100%', textAlign: 'center' }}>
          <img src={EchoLogo} alt="ECHO" style={{ height: '24px' }} />
        </div>

        <nav className="flex flex-col gap-1">
          <NavItem icon={<img src={HomeIcon} alt="Dashboard" style={{ width: 20, height: 20 }} />} label="Dashboard" active />
          <NavItem icon={<img src={ActivityIcon} alt="Timeline" style={{ width: 20, height: 20 }} />} label="Timeline" />
          <NavItem icon={<img src={SearchIcon} alt="Ask" style={{ width: 20, height: 20 }} />} label="Ask" />
          <NavItem icon={<img src={FolderIcon} alt="Projects" style={{ width: 20, height: 20 }} />} label="Projects" />
          <NavItem icon={<img src={SettingsIcon} alt="Settings" style={{ width: 20, height: 20 }} />} label="Settings" />
          <NavItem icon={<img src={UserIcon} alt="Profile" style={{ width: 20, height: 20 }} />} label="Profile" />
        </nav>
      </div>


      {/* Middle Section - Time */}
      <div className="card flex flex-col gap-4" style={{ marginBottom: '16px' }}>
        {/* Time Display */}
        <div className="flex items-center">
          <img src={ClockIcon} alt="Time" style={{ width: 24, height: 24, marginRight: '16px' }} />
          <span style={{ fontSize: '24px', fontWeight: 500 }}>{formatTime(currentTime)}</span>
        </div>
        
        {/* Current File */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentFile.length > 30 ? currentFile.substring(0, 30) + '...' : currentFile}
          </span>
        </div>
        
        {/* Current Project */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '16px' }}>{currentProject}</span>
        </div>


        {/* Time Spent */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 24px 10px 16px',
          borderRadius: '9999px',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          marginTop: '8px'
        }}>
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#60A5FA" strokeWidth="3" strokeDasharray={`${progressPercent}, 100`} />
            </svg>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>{timeSpent} hours spent</span>
        </div>
      </div>

      {/* Bottom Section - Tracking */}
      <div className="card flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <div style={{ width: 12, height: 12, background: events.length > 0 ? '#4ADE80' : '#71717a', borderRadius: '50%', boxShadow: events.length > 0 ? '0 0 8px #4ADE80' : 'none' }}></div>
          <span style={{ fontWeight: 500 }}>{events.length > 0 ? 'Tracking Active' : 'No Activity'}</span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span style={{ fontSize: '14px' }}>{events.length} events today</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last: {getTimeAgo()}</span>
        </div>

        <div className="flex gap-4 w-full">
          <button 
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
            style={{ 
              flex: 1,
              padding: '10px 20px',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>Pause</button>
          <button 
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'}
            style={{ 
              flex: 1,
              padding: '10px 20px',
              borderRadius: '9999px',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 4px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>Settings</button>
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className={`nav-item ${active ? 'active' : ''}`}>
    {icon}
    <span>{label}</span>
  </div>
);

export default Sidebar;
