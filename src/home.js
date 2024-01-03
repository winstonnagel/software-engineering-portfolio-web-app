import React from 'react';
import './home.css'; // Assuming you will have a separate CSS file for styling


const home = () => {
  return (
    <div className="home-container">
      <h1 className="home-header">Welcome to ThePortfolio</h1>
      <p className="home-subheader">ThePortfolio is a website where you can create virtual portfolios and learn about finance.</p>
      <p className="home-subheader">To use ThePortfolio, please login or create account.</p>
      <p className="home-subheader">If you are already logged in, used the tool below to get started.</p>
    </div>
  );
}

export { home };
