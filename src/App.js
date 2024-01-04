import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import Chart from 'chart.js/auto';
import axios from 'axios';
import 'chartjs-adapter-date-fns';
import FinanceDefinitions from './financedefinitions.js';
import Loginpage from './login.js';
import { Home } from './Home.js';



function App() {
  const [tickers, setTickers] = useState('');
  const [stockData, setStockData] = useState([]);
  const [stockMetrics, setStockMetrics] = useState([]);
  const [error, setError] = useState('');

  const chartRef = useRef(null);
  const [showGraph, setShowGraph] = useState(false);
  const [spMetrics, setSpMetrics] = useState(null);
  const [dowMetrics, setDowMetrics] = useState(null);
  const [nasdaqMetrics, setNasdaqMetrics] = useState(null);
  const [russellMetrics, setRussellMetrics] = useState(null);
  const [legendFontSize, setLegendFontSize] = useState(30);
  const [showDefinitions, setShowDefinitions] = useState(false);
  const [handlelogin, sethandlelogin] = useState(false);


  // this adds colours to the stock chart
  const colors = [
    'rgba(75, 192, 192, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 128, 0, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(75, 0, 130, 1)',
    'rgba(0, 128, 0, 1)',
    'rgba(128, 0, 128, 1)',

  ]

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (showGraph) {
      const ctx = document.getElementById('combinedStockGraph');
      ctx.width = 800;
      ctx.height = 350;

      const datasets = stockData.map((stock, index) => ({
        label: stock.ticker || 'S&P 500',
        data: stock.data.map(data => ({ x: data.date, y: data.close })),
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        fill: false
      }));




      // Add the S&P 500 data to the datasets
      const combinedChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stockData[0] ? stockData[0].data.map(data => data.date) : [],
          datasets: datasets
        },
        options: {
          plugins: {
            legend: {
              labels: {
                fontSize: legendFontSize // Set the font size for the legend labels
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'year',
                min: stockData[0] ? stockData[0].data[0].date : undefined,
                max: stockData[0] ? stockData[0].data[stockData[0].data.length - 1].date : undefined
              },
              beginAtZero: true
            },
            y: { beginAtZero: true }
          }
        }
      });


      chartRef.current = combinedChart;
    }
  }, [stockData, showGraph, spMetrics, legendFontSize, colors]);




  // this formats the market cap and revenue to billions
  const formatValue = (value) => {
    if (value < 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else {
      return `$${(value / 1e9).toFixed(0)}B`;
    }
  };
  // this changes the beta color based on its value
  const getBetaColor = (value) => {
    if (value < 0.6 || value > 1.5) {
      return { color: 'red' };
    } else if (value > 0.6 && value < 1.5) {
      return { color: 'rgb(0, 255, 44)' };
    }
    return {};
  };
  // this changes the percentage color based on its value
  const getpercentageColor = (value) => {
    if (value < 0) {
      return 'red';
    } else if (value > 0) {
      return 'rgb(0, 255, 44)';
    }
    return 'inherit';
  }

  const [showLearnMore, setShowLearnMore] = useState(false);


  const formatMarketCap = (marketcap) => formatValue(marketcap);
  const formatRevenue = (revenue) => formatValue(revenue);

  // this computes the average of the financial metrics by checking if the data is valid
  const computeAverage = (data, key) => {
    const validData = data.filter(stock => stock.metrics && !isNaN(stock.metrics[key]) && stock.metrics[key] !== null && stock.metrics[key] !== undefined).map(stock => stock.metrics[key]);

    if (validData.length === 0) {
      console.warn(`No valid data found for key: ${key}`);
      return "N/A";
    }

    const averageValue = (validData.reduce((acc, val) => acc + parseFloat(val), 0) / validData.length).toFixed(2);

    // Check if the key is 'dividendYield' and format the value as a percentage
    if (key === 'dividendYield') {
      return `${averageValue}%`;
    } else {
      return averageValue;
    }
  };




  // this fetches the stock data from the API
  const fetchStockData = async (tickers, years) => {

    const tickerList = tickers.split(',').map(ticker => ticker.trim());

    const fetchDataPromises = tickerList.map(async (ticker) => {
        try {
            const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart/1y?range=10y&token=ADD_IEX_CLOUD_TOKEN_HERE`);
            const dataSinceStartDate = response.data.map(data => ({
                date: data.date,
                close: data.close
            }));
            return {
                ticker,
                data: dataSinceStartDate.reverse()
            };
        } catch (error) {
            console.error(`Error fetching data for ${ticker}:`, error);
            setError(`Error fetching data for ${ticker}. Please check the ticker and try again.`);
            return null;
        }
    });


    // this fetches the S&P500 financial metrics from the API
    const fetchSp500Metrics = async () => {
      try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/SPY/advanced-stats?token=ADD_IEX_CLOUD_TOKEN_HERE`);
          return response.data;

      } catch (error) {
          console.error('Error fetching S&P 500 metrics:', error);
          return null;
      }
  };
    // this fetches the Dow Jones financial metrics from the API
    const fetchDowjonesMetrics = async () => {
      try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/DIA/advanced-stats?token=ADD_IEX_CLOUD_TOKEN_HERE`);
          return response.data;

      } catch (error) {
          console.error('Error fetching Dow Jones metrics:', error);
          return null;
      }
  };
    // this fetches the Nasdaq financial metrics from the API
    const fetchNasdaqMetrics = async () => {
      try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/QQQ/advanced-stats?token=ADD_IEX_CLOUD_TOKEN_HERE`);
          return response.data;

      } catch (error) {
          console.error('Error fetching Nasdaq metrics:', error);
          return null;
      }
  };
    // this fetches the Russell financial metrics from the API
    const fetchRussellMetrics = async () => {
      try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/IWM/advanced-stats?token=ADD_IEX_CLOUD_TOKEN_HERE`);
          return response.data;

      } catch (error) {
          console.error('Error fetching Russell metrics:', error);
          return null;
      }
  };

    // this fetches the stock metrics from the API
    const fetchMetricsPromises = tickerList.map(async (ticker) => {
        try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/advanced-stats?token=ADD_IEX_CLOUD_TOKEN_HERE`);
          const sectorResponse = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/company?token=ADD_IEX_CLOUD_TOKEN_HERE`);
            const chartDataResponse = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart/1y?token=ADD_IEX_CLOUD_TOKEN_HERE`);

            const price52WeeksAgo = chartDataResponse.data[response.data.length - 52]?.close || 0;
            const epsValue = response.data.ttmEPS;
            const parsedEps = parseFloat(epsValue); // corrected parsing
            const companyname = sectorResponse.data.companyName;

            // this returns the stock metrics
            return {
                ticker,
                companyname,
                metrics: {
                    marketcap: parseFloat(response.data.marketcap).toFixed(2),
                    peRatio: parseFloat(response.data.peRatio).toFixed(2),
                    beta: parseFloat(response.data.beta).toFixed(2),
                    dividendYield: (response.data.dividendYield * 100).toFixed(2),
                    ttmEPS: isNaN(parsedEps) ? "N/A" : parsedEps.toFixed(2),
                    week52high: parseFloat(response.data.week52high).toFixed(2),
                    week52low: parseFloat(response.data.week52low).toFixed(2),
                    price52WeeksAgo,
                    profitMargin: parseFloat(response.data.profitMargin).toFixed(2),
                    revenue: parseFloat(response.data.revenue).toFixed(2),
                    maxChangePercent: parseFloat(response.data.maxChangePercent * 100).toFixed(2),
                    year5ChangePercent: parseFloat(response.data.year5ChangePercent * 100).toFixed(2),
                    year1ChangePercent: parseFloat(response.data.year1ChangePercent * 100).toFixed(2),
                    month6ChangePercent: parseFloat(response.data.month6ChangePercent * 100).toFixed(2),
                    day5ChangePercent: parseFloat(response.data.day5ChangePercent * 100).toFixed(2),

                  },
                sector: sectorResponse.data.sector
            };
        } catch (error) {
            console.error(`Error fetching data for ${ticker}:`, error);
            setError(`Error fetching data for ${ticker}. Please check the ticker and try again.`);
            return null;
        }
    });

    const fetchedData = await Promise.all(fetchDataPromises);
    const fetchedMetrics = await Promise.all(fetchMetricsPromises);

    // this returns the S&P500 metrics
    const sp500Data = await fetchSp500Metrics();
    console.log("S&P 500 Data:", sp500Data);
    setSpMetrics(sp500Data);

    setStockData(fetchedData.filter(Boolean));
    setStockMetrics(fetchedMetrics.filter(Boolean));

    // this returns the Dow Jones metrics
    const dowjonesData = await fetchDowjonesMetrics();
    console.log("Dow Jones Data:", dowjonesData);
    setDowMetrics(dowjonesData);

    // this returns the Nasdaq metrics
    const nasdaqData = await fetchNasdaqMetrics();
    console.log("Nasdaq Data:", nasdaqData);
    setNasdaqMetrics(nasdaqData);

    // this returns the Russell metrics
    const russellData = await fetchRussellMetrics();
    console.log("Russell Data:", russellData);
    setRussellMetrics(russellData);
};

  // this handles the input change and sets the tickers to uppercase
  const handleInputChange = (event) => {
    setTickers(event.target.value.toUpperCase());
    const inputFontSize = 40;
    setLegendFontSize(inputFontSize);
    setError('');
  };

  // this handles the submit button and fetches the stock data
  const handleSubmit = (event) => {
    event.preventDefault();
    fetchStockData(tickers);
    setShowLearnMore(true);
    setShowGraph(true);

  };

  const handleLogin = () => {
    console.log('Login Button clicked');
    sethandlelogin(true);
    setShowDefinitions(false);
};

// this closes the finance definitions page
const handleCloseDefinitions = () => {
  setShowDefinitions(false);
  sethandlelogin(false);
};


// this closes the login page
const handleLearnAboutFinance = () => {
  console.log('Learn About Finance Button clicked');
  sethandlelogin(false); // Set handlelogin to false
  setShowDefinitions(true); // Set showDefinitions to true to show the FinanceDefinitions
};

  // this gets the average of the percentage changes
  const averagemaxChangePercent = computeAverage(stockMetrics, 'maxChangePercent');
  const averageYear5ChangePercent = computeAverage(stockMetrics, 'year5ChangePercent');
  const averageYear1ChangePercent = computeAverage(stockMetrics, 'year1ChangePercent');
  const averageMonth6ChangePercent = computeAverage(stockMetrics, 'month6ChangePercent');
  const averageDay5ChangePercent = computeAverage(stockMetrics, 'day5ChangePercent');



// this handles the tabs
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-buttons">
          <button className="big-button" onClick={handleLearnAboutFinance}>Learn About Finance</button>
            <button className="big-button" onClick={handleLogin}>Login</button>
          </div>
          <img src={logo} className="App-logo" alt="logo" />
          {Home && <Home onClose={handleCloseDefinitions} />}

          {/* this is the input box */}
          <div className="header-input">
    <div className="home-container">
      <h2 className="home-header">Begin by entering stocks tickers below</h2>
      <p className="home-subheader"></p>
      <p className="home-subheader"></p>
      <p className="home-subheader"></p>
    </div>
            <input
              type="text"
              placeholder="Enter tickers separated by commas. Example: AAPL for Apple"
              value={tickers}
              onChange={handleInputChange}
              style={{ fontSize: '18px', textAlign: 'center' }}
            />
            <button type="submit" onClick={handleSubmit} style={{ fontSize: '1.5em', padding: '10px 20px' }}>Show stocks</button>
          </div>
        </div>
        {showDefinitions && <FinanceDefinitions onClose={handleCloseDefinitions} />}
        {handlelogin && <Loginpage onClose={handleCloseDefinitions} />}

        {/* this creates the table */}
        {stockMetrics.length > 0 && (
    <div className="metrics-section">
        <h2>Your Portfolio's Financial Metrics</h2>
        <table>
        <thead>
          <tr>
              <th>Ticker</th>
              <th>Company Name</th>
              <th>Sector</th>
              <th>Market Cap</th>
              <th>PE Ratio</th>
              <th>Beta(volatility, 1=market average)</th>
              <th>Dividend Yield</th>
              <th>EPS (TTM)</th>
              <th>Profit Margin</th>
              <th>Revenue</th>
              <th>Max Change (%)</th>
              <th>5-Year Change (%)</th>
              <th>1-Year Price Increase (%)</th>
              <th>6-Month Change (%)</th>
              <th>5-Day Change (%)</th>


          </tr>

      </thead>
      <tbody>
    {stockMetrics.map((stock, index) => (

        // this creates the table rows and shows the metrics for each stock
        <>
            <tr key={index} style={{ backgroundColor: 'transparent' }}>
                <td>{stock.ticker}</td>
                <td>{stock.companyname}</td>
                <td>{stock.sector}</td>
                <td>{formatMarketCap(stock.metrics.marketcap)}</td>
                <td>{stock.metrics.peRatio}</td>
                <td style={getBetaColor(stock.metrics.beta)}>{stock.metrics.beta}</td>
                <td>{stock.metrics.dividendYield === "0.00" ? "0" : `${stock.metrics.dividendYield}%`}</td>
                <td>{stock.metrics.ttmEPS}</td>
                <td>{stock.metrics.profitMargin}</td>
                <td>{formatRevenue(stock.metrics.revenue)}</td>
                <td style={{ color: getpercentageColor(stock.metrics.maxChangePercent) }}>{stock.metrics.maxChangePercent === "N/A" ? "N/A" : `${stock.metrics.maxChangePercent}%`}</td>
                <td style={{ color: getpercentageColor(stock.metrics.year5ChangePercent) }}>{stock.metrics.year5ChangePercent === "N/A" ? "N/A" : `${stock.metrics.year5ChangePercent}%`}</td>
                <td style={{ color: getpercentageColor(stock.metrics.year1ChangePercent) }}>{stock.metrics.year1ChangePercent === "N/A" ? "N/A" : `${stock.metrics.year1ChangePercent}%`}</td>
                <td style={{ color: getpercentageColor(stock.metrics.month6ChangePercent) }}>{stock.metrics.month6ChangePercent === "N/A" ? "N/A" : `${stock.metrics.month6ChangePercent}%`}</td>
                <td style={{ color: getpercentageColor(stock.metrics.day5ChangePercent) }}>{stock.metrics.day5ChangePercent === "N/A" ? "N/A" : `${stock.metrics.day5ChangePercent}%`}</td>

                </tr>
            {index < stockMetrics.length - 1 && <tr className="separator-row"><td colSpan="15"></td></tr>}
        </>
    ))}
    {/* this creates the average row */}
<tr className="average-row">
    <td>Averages</td>
    <td>-</td>
    <td>-</td>
    <td>{formatMarketCap(parseFloat(computeAverage(stockMetrics, 'marketcap')))}</td>
    <td>{computeAverage(stockMetrics, 'peRatio')}</td>
    <td style={{ color: getpercentageColor(computeAverage(stockMetrics, 'beta')) }}>{computeAverage(stockMetrics, 'beta')}</td>
    <td>{computeAverage(stockMetrics, 'dividendYield')}</td>
    <td>{computeAverage(stockMetrics, 'ttmEPS')}</td>
    <td>{computeAverage(stockMetrics, 'profitMargin')}</td>
    <td>{formatRevenue(computeAverage(stockMetrics, 'revenue'))}</td>
    <td style={{ color: getpercentageColor(averagemaxChangePercent) }}>{averagemaxChangePercent === "N/A" ? "N/A" : `${averagemaxChangePercent}%`}</td>
    <td style={{ color: getpercentageColor(averageYear5ChangePercent) }}>{averageYear5ChangePercent === "N/A" ? "N/A" : `${averageYear5ChangePercent}%`}</td>
    <td style={{ color: getpercentageColor(averageYear1ChangePercent) }}>{averageYear1ChangePercent === "N/A" ? "N/A" : `${averageYear1ChangePercent}%`}</td>
    <td style={{ color: getpercentageColor(averageMonth6ChangePercent) }}>{averageMonth6ChangePercent === "N/A" ? "N/A" : `${averageMonth6ChangePercent}%`}</td>
    <td style={{ color: getpercentageColor(averageDay5ChangePercent) }}>{averageDay5ChangePercent === "N/A" ? "N/A" : `${averageDay5ChangePercent}%`}</td>


</tr>

{/* this creates the S&P500 row */}
{spMetrics && (
    <tr className="sp500-row">
        <td>S&P 500</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.maxChangePercent) }}>{spMetrics && spMetrics.maxChangePercent ? `${(spMetrics.maxChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.year5ChangePercent) }}>{spMetrics && spMetrics.year5ChangePercent ? `${(spMetrics.year5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.year1ChangePercent) }}>{spMetrics && spMetrics.year1ChangePercent ? `${(spMetrics.year1ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.month6ChangePercent) }}>{spMetrics && spMetrics.month6ChangePercent ? `${(spMetrics.month6ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.day5ChangePercent) }}>{spMetrics && spMetrics.day5ChangePercent ? `${(spMetrics.day5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>


</tr>
)}
{/* this creates the Dow Jones row */}
{dowMetrics && (
  <tr className="dowjones-row">
      <td>Dow Jones</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td style={{ color: getpercentageColor(dowMetrics && dowMetrics.maxChangePercent) }}>{dowMetrics && dowMetrics.maxChangePercent ? `${(dowMetrics.maxChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(dowMetrics && dowMetrics.year5ChangePercent) }}>{dowMetrics && dowMetrics.year5ChangePercent ? `${(dowMetrics.year5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(dowMetrics && dowMetrics.year1ChangePercent) }}>{dowMetrics && dowMetrics.year1ChangePercent ? `${(dowMetrics.year1ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(dowMetrics && dowMetrics.month6ChangePercent) }}>{dowMetrics && dowMetrics.month6ChangePercent ? `${(dowMetrics.month6ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(dowMetrics && dowMetrics.day5ChangePercent) }}>{dowMetrics && dowMetrics.day5ChangePercent ? `${(dowMetrics.day5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>




</tr>
)}
{/* this creates the Nasdaq row */}
{nasdaqMetrics && (
  <tr className="nasdaq-row">
      <td>Nasdaq</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td style={{ color: getpercentageColor(nasdaqMetrics && nasdaqMetrics.maxChangePercent) }}>{nasdaqMetrics && nasdaqMetrics.maxChangePercent ? `${(nasdaqMetrics.maxChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(nasdaqMetrics && nasdaqMetrics.year5ChangePercent) }}>{nasdaqMetrics && nasdaqMetrics.year5ChangePercent ? `${(nasdaqMetrics.year5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(nasdaqMetrics && nasdaqMetrics.year1ChangePercent) }}>{nasdaqMetrics && nasdaqMetrics.year1ChangePercent ? `${(nasdaqMetrics.year1ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(nasdaqMetrics && nasdaqMetrics.month6ChangePercent) }}>{nasdaqMetrics && nasdaqMetrics.month6ChangePercent ? `${(nasdaqMetrics.month6ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(nasdaqMetrics && nasdaqMetrics.day5ChangePercent) }}>{nasdaqMetrics && nasdaqMetrics.day5ChangePercent ? `${(nasdaqMetrics.day5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>

</tr>
)}
{/* this creates the Russell row */}
{russellMetrics && (
  <tr className="russell-row">
    <td>Russell</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td style={{ color: getpercentageColor(russellMetrics && russellMetrics.maxChangePercent) }}>{russellMetrics && russellMetrics.maxChangePercent ? `${(russellMetrics.maxChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(russellMetrics && russellMetrics.year5ChangePercent) }}>{russellMetrics && russellMetrics.year5ChangePercent ? `${(russellMetrics.year5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(russellMetrics && russellMetrics.year1ChangePercent) }}>{russellMetrics && russellMetrics.year1ChangePercent ? `${(russellMetrics.year1ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(russellMetrics && russellMetrics.month6ChangePercent) }}>{russellMetrics && russellMetrics.month6ChangePercent ? `${(russellMetrics.month6ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
      <td style={{ color: getpercentageColor(russellMetrics && russellMetrics.day5ChangePercent) }}>{russellMetrics && russellMetrics.day5ChangePercent ? `${(russellMetrics.day5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>

</tr>

)}
</tbody>
</table>
</div>
        )}

{showLearnMore && (
        <li style={{ listStyleType: 'none', fontSize: '1.5em', marginTop: '20px' }}>
          To learn more about the financial metrics above, please click the <span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Learn About Finance</span> Button.
        </li>
      )}

{/* this shows the graph */}
{showGraph && (
  <div className="graphs-container">
    <div className="stock-graph">
      <h3>{tickers.split(',').length === 1 ? 'Stock Chart' : 'Combined Stock Chart'}</h3>
      <canvas
        id="combinedStockGraph"
        width="100"   // Adjusted width for a bigger chart
        height="600"  // Adjusted height for a bigger chart
      ></canvas>
    </div>
  </div>
)}
{error && (
  <div className="error-message">
    <p>{error}</p>
  </div>
)}
      </header>
    </div>
  );
}

export default App;
