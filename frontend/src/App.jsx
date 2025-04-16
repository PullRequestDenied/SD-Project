import React, { useState } from "react";
import "./App.css";

function App() {
  const [showPopup, setShowPopup] = useState(true);

  return (
    <div className="wrapper">
      <header className="header">
        <div className="logo">Constitutional Archive Search</div>
        <div className="auth-links">
          <button className="link-button">Log in</button>
          <button className="link-button signup">Sign up</button>
        </div>
      </header>

      <div className="container">
        <h1 className="title">Constitutional Archive Search</h1>
        <div className="searchBar">
          <input
            className="searchInput"
            placeholder="Ask a question about the archives..."
          />
          <button className="searchButton">Search</button>
        </div>
        <div className="results">
          <p>Try: "What did the 1996 Constitution say about human rights?"</p>
        </div>
      </div>

      {showPopup && (
        <div className="authPopup fixed-bottom-right">
          <button className="closeBtn" onClick={() => setShowPopup(false)}>×</button>
          <p>Want to save your searches?</p>
          <div className="authPopup-buttons">
            <button className="popupBtn">Log in</button>
            <button className="popupBtn outlined">Sign up</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
