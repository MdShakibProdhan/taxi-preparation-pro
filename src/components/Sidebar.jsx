import { NavLink } from 'react-router-dom';
import { BookOpen, Layers, Target, Clock, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Taxi Exam Pro</span>
        </div>
        
        <div className="sidebar-nav">
          <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} />
            <span>All Questions</span>
          </NavLink>
          
          <NavLink to="/exclusive" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Target size={20} />
            <span>Exclusive</span>
          </NavLink>
          
          <NavLink to="/study" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={20} />
            <span>Study (Keywords)</span>
          </NavLink>
          
          <NavLink to="/preparation" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Layers size={20} />
            <span>Exam Preparation</span>
          </NavLink>
          
          <NavLink to="/exam" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <Clock size={20} />
            <span>Practice Exam</span>
          </NavLink>
          
          <NavLink to="/recovery" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <RefreshCw size={20} />
            <span>Review (Wrong Answers)</span>
          </NavLink>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
