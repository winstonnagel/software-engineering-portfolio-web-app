import React from 'react';
import './login.css'; // Assuming you will have a separate CSS file for styling

const Loginpage = ({ onClose }) => {
  return (
    <div className="login-container">
    <button onClick={onClose} style={{ fontSize: '1.5em', padding: '10px 20px', display: 'block', margin: 'auto' }}>Close page</button>
      <h1 className="login-header">Login Here</h1>
      <p className="login-subheader">Choose between Beginner or Pro</p>

      <div className="plan-container">
        <div className="plan-box">
          <h2>PortfolioBeginner</h2>
          <p>Create portfolios and view stock metric averages</p>
          <p>Access Learn about Finance page</p>
        </div>

        <div className="plan-box pro">
          <h2>PortfolioPro</h2>
          <p>Create portfolios and view stock metric averages</p>
          <p>Access Learn about Finance page</p>
          <p>Get personalised stock recommendations</p>
          <p>View averages through different types of graphs</p>
          <p>Get weekly performance reports on all created portfolios</p>
          <p>Only $5/month</p>
        </div>
      </div>

      <div className="input-container">
        <input type="email" placeholder="Email" className="login-input" />
        <input type="password" placeholder="Password" className="login-input" />
        <button className="login-button">Login</button>
      </div>
    </div>
  );
}

export default Loginpage;
