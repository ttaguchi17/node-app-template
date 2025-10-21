// src/components/Footer.jsx
import React from 'react'; // Removed unused hooks

function Footer() {
  return (
    <footer className="sticky-footer"> {/* Use our custom class */}
      <div className="container my-auto">
        <div className="copyright text-center my-auto">
          <span>© {new Date().getFullYear()} Travel App</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;