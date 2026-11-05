import React from "react";
import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer-bg">
            <div className="footer-content container">
                <div className="footer-section">
                    <div className="footer-logo mb-3">
                        <img
                            src="/assets/logo.png"
                            alt="UTKAL ODR - Online Dispute Resolution"
                            className="footer-logo-img"
                        />
                    </div>
                    <h4>About UTKAL ODR</h4>
                    <p style={{ textAlign: 'left' }}>
                        Online Dispute Resolution platform providing accessible, cost-effective,
                        and transparent dispute resolution services.
                    </p>
                </div>
                <div className="footer-section">
                    <h4>Services</h4>
                    <ul>
                        <li><Link to="/rules#article-7">Negotiation</Link></li>
                        <li><Link to="/rules#article-8">Mediation</Link></li>
                        <li><Link to="/rules#article-9">Arbitration</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/#">How It Works</Link></li>
                        <li><Link to="/#">Pricing</Link></li>
                        <li><Link to="/rules">Rules</Link></li>
                        <li><Link to="/#">FAQ</Link></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Contact</h4>
                    <ul>
                        <li><a href="mailto:contact@utkalodr.com">contact@utkalodr.com</a></li>
                        <li><a href="tel:+919187102299">+91 91871 02299</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Our aligned partners</h4>
                    <ul>
                        <li><a href="https://www.legalion.co.in">legalion</a></li>
                        <li><a href="https://infotattvabusinesssolutions.com/">InfoTattva</a></li>
                    </ul>
                </div>
            </div>
            <div className="footer-bottom text-center">
                <p>&copy; 2026 UTKAL ODR - Utkrusht Vibad Samadhan. All rights reserved. | Powered by Gokulananda Chaudhuri Foundation</p>
            </div>
        </footer>
    );
}

export default Footer;
