import React from 'react';
import './financedefinitions.css';

// code for the finance definitions page
const FinanceDefinitions = ({ onClose }) => {
  return (
    <div className="definitions-modal">
    <h2 style={{ textAlign: 'center' }}>Finance 101</h2>
    <ul className="definitions-list">
                <li><strong style = {{textDecoration:'underline'}}>Ticker:</strong> This is the stock symbol of a company. For example, GS is the ticker for Goldman Sachs.</li>
                <li><strong style = {{textDecoration:'underline'}}>Sector:</strong> This is the sector of the company. For example, GS is in the Finance and Insurance sector.</li>
                <li><strong style = {{textDecoration:'underline'}}>Market Cap:</strong> This represents the total value of all a company's shares of stock.</li>
                <li><strong style = {{textDecoration:'underline'}} >PE Ratio:</strong> This represents te share price divided by the earnings per share.</li>
                <li><strong style = {{textDecoration:'underline'}}>Beta: </strong> This represents a measure of market risk. The base Beta is 1.
                This means that if a stock has a beta of 2 and the market goes up by 10%, that this stock will go up 20%. Same with other values.
                If a stock has a beta of 0.8 and a stock goes up 10%, then this stock will go up only 8%.
                Furethermore, a stock with a beta of -1 will go up if stock goes down. For example, if the market goes down 10%, this stock will go up 10%.</li>
                <li><strong style = {{textDecoration:'underline'}}>Dividend Yield:</strong> This represents the dividend per share divided by the share price.
                The dividend of a company is the payment of a company to its shareholders.
                For example, if you own 1 share of stock that has a stock price of 10 and the company gives out a 5% dividend,
                you get $0.5 every time they give out dividends, usually quarterly and sometimes anually.
                Some companies such as Amazon do not pay dividends as they prefer to keep the dividend payment money and reinvest it into its operations. This is called plowback. </li>
                <li><strong style = {{textDecoration:'underline'}}>Earnings Per Share(EPS):</strong> This represents the earnings of a company divided by the number of shares.
                For example, if a company has a profit of $100 and has 10 shares, the EPS is $10.</li>
                <li><strong style = {{textDecoration:'underline'}}>Profit Margin:</strong> This represents the profit of a company divided by the revenue.
                For example, if a company has a profit of $100 and has a revenue of $1000, the profit margin is 10%.</li>
            </ul>
            <button onClick={onClose} style={{ fontSize: '1.5em', padding: '10px 20px', display: 'block', margin: 'auto' }}>Close and return to my portoflio page</button>
        </div>
    );
}

export default FinanceDefinitions;
