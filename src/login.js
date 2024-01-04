import React, { useState } from 'react';
import './login.css';

// code for the login page
const Loginpage = ({ onClose }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className="login-container">
      <button onClick={onClose} style={{ fontSize: '1.5em', padding: '10px 20px', display: 'block', margin: 'auto' }}>Close page</button>
      <h1 className="login-header">Login Here</h1>

      <div className="input-container">
        <input type="email" placeholder="Email" className="login-input" />
        <input type="password" placeholder="Password" className="login-input" />

        <div className="checkbox-container">
          <div className="checkbox-item">
          <input type="checkbox" id="weeklyPerformance" onChange={handleCheckboxChange} />
            <label htmlFor="weeklyPerformance" className="email-label">
              Receive weekly performance reports
            </label>
          </div>

          <div className="checkbox-item">
            <input type="checkbox" id="marketNews" onChange={handleCheckboxChange} />
            <label htmlFor="marketNews" className="email-label">
              Receive market news
            </label>
          </div>
        </div>

        <button className="login-button">Login</button>
      </div>
    </div>
  );
}


export default Loginpage;
