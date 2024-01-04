import React from 'react';
import './home.css';

// code for the home page
const Home = () => {
  return (
    <div className="home-container">
      <h1 className="home-header">Welcome to ThePortfolio</h1>
      <p className="home-subheader">ThePortfolio is a website where you can create virtual portfolios and learn about finance.</p>
      <p className="home-subheader">To use ThePortfolio, please login or create an account.</p>
      <p className="home-subheader">If you are already logged in, used the tool below to get started.</p>
    </div>
  );
}

export { Home };
