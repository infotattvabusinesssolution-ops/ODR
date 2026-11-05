import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();

  // Close nav when route/hash changes
  useEffect(() => {
    setIsNavOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  // Close nav on tap/click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isNavOpen && navRef.current && !navRef.current.contains(e.target)) {
        setIsNavOpen(false);
        setIsDropdownOpen(false);
      }
    };

    if (isNavOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isNavOpen]);

  const closeNav = () => {
    setIsNavOpen(false);
    setIsDropdownOpen(false);
  };

  const changeLanguage = (e, langCode) => {
    e.preventDefault();
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
    if (langCode === 'en') {
      document.cookie = `googtrans=/en/en; path=/;`;
      document.cookie = `googtrans=/en/en; domain=.${window.location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; domain=.${window.location.hostname}; path=/;`;
    }
    window.location.reload();
  };

  const supportedLanguagesStr = import.meta.env.VITE_SUPPORTED_LANGUAGES || 'en:English,or:ଓଡ଼ିଆ (Odia),hi:हिंदी (Hindi)';
  const supportedLanguages = supportedLanguagesStr.split(',').map(lang => {
      const [code, name] = lang.split(':');
      return { code, name };
  });

  return (
    <>
      <header className="sticky-top" ref={navRef} style={{ zIndex: 1050 }}>
          <nav className="navbar navbar-expand-lg navbar-dark bg-black">
              <div className="container">
                  {/* LOGO */}
                  <Link className="navbar-brand d-flex align-items-center" to="/" onClick={closeNav}>
                      <img 
                          src="/assets/logo.png" 
                          alt="UTKAL ODR - Online Dispute Resolution" 
                          style={{ 
                              height: "46px", 
                              width: "auto", 
                              objectFit: "contain",
                              display: "block"
                          }} 
                      />
                  </Link>

                  {/* TOGGLER */}
                  <button 
                      className={`navbar-toggler ${isNavOpen ? '' : 'collapsed'}`} 
                      type="button" 
                      aria-controls="mainNavbar"
                      aria-expanded={isNavOpen}
                      aria-label="Toggle navigation"
                      onClick={() => setIsNavOpen(prev => !prev)}
                  >
                      <span className="navbar-toggler-icon"></span>
                  </button>

                  {/* MENU */}
                  <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="mainNavbar">
                      <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">
                          <li className="nav-item">
                              <Link className="nav-link" to="/#home" onClick={closeNav}>Home</Link>
                          </li>
                          <li className="nav-item">
                              <Link className="nav-link" to="/#services" onClick={closeNav}>Services</Link>
                          </li>
                          <li className="nav-item">
                              <Link className="nav-link" to="/blog" onClick={closeNav}>Blog</Link>
                          </li>
                          <li className="nav-item">
                              <Link className="nav-link" to="/#knowledge" onClick={closeNav}>Knowledge</Link>
                          </li>

                          {/* Language Switcher - React Controlled */}
                          <li className={`nav-item dropdown ${isDropdownOpen ? 'show' : ''}`}
                              onMouseEnter={() => setIsDropdownOpen(true)}
                              onMouseLeave={() => setIsDropdownOpen(false)}
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                              <a className="nav-link dropdown-toggle d-flex align-items-center gap-1" href="#" role="button" aria-expanded={isDropdownOpen}>
                                  <i className="bi bi-globe"></i> Language
                              </a>
                              <ul className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? 'show' : ''}`} style={{position: 'absolute', margin: 0}}>
                                  {supportedLanguages.map(lang => (
                                      <li key={lang.code}>
                                          <a className="dropdown-item" href="#" onClick={(e) => changeLanguage(e, lang.code)}>
                                              {lang.name}
                                          </a>
                                      </li>
                                  ))}
                              </ul>
                          </li>

                          <li className="nav-item">
                              <Link className="btn rounded-pill px-4 text-black fw-bold" to="/#cta" style={{ backgroundColor: 'white' }} onClick={closeNav}>
                                  Connect
                              </Link>
                          </li>
                      </ul>
                  </div>
              </div>
          </nav>
      </header>

      {/* Dimmed backdrop when mobile menu is open - tap anywhere to close */}
      {isNavOpen && (
          <div 
              className="d-lg-none"
              onClick={closeNav}
              style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 1040,
                  transition: 'opacity 0.2s ease'
              }}
          />
      )}
    </>
  );
}

export default Navbar;
