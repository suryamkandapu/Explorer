import React from 'react';
import { AiOutlineHome, AiOutlinePlusSquare } from 'react-icons/ai';
import { FiCompass } from 'react-icons/fi';
import { BsChatDots } from 'react-icons/bs';         // Message icon
import { CgProfile } from 'react-icons/cg';
import '../../Styles/HomeFooter.css';
import { NavLink } from 'react-router-dom';

const HomeFooter = () => {
  return (
    <div className='Home-footer'>
      <a
        href="/home"
        className={window.location.pathname === "/home" ? "active-link" : "inactive-link"}
      >
        <AiOutlineHome size={20} />
      </a>

      <NavLink 
        to="/explorer" 
        className={({ isActive }) => isActive ? "active-link" : "inactive-link"}
      >
        <FiCompass size={20} />
      </NavLink>

      <NavLink 
        to="/addFeed" 
        className={({ isActive }) => isActive ? "active-link" : "inactive-link"}
      >
        <AiOutlinePlusSquare size={20} />
      </NavLink>

      <NavLink 
        to="/messages" 
        className={({ isActive }) => isActive ? "active-link" : "inactive-link"}
      >
        <BsChatDots size={20} />
      </NavLink>

      <NavLink 
        to="/UserProfile" 
        className={({ isActive }) => isActive ? "active-link" : "inactive-link"}
      >
        <CgProfile size={20} />
      </NavLink>
    </div>
  );
}

export default HomeFooter;
