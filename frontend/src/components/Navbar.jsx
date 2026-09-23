import React from 'react';

export default function Navbar({ onLogoClick }) {
  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={onLogoClick}>
        <span>BPKAD BEKASI</span>
      </div>


    </nav>
  );
}
