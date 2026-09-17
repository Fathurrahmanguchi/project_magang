import React from 'react';

export default function Navbar({ onLogoClick }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={onLogoClick}>
        <div className="brand-icon">B</div>
        <span>BPKAD BEKASI</span>
      </div>


    </nav>
  );
}
