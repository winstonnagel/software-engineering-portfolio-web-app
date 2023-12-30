import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import Chart from 'chart.js/auto';
import axios from 'axios';
import 'chartjs-adapter-date-fns';

function App() {
  const [tickers, setTickers] = useState('');
  const [stockData, setStockData] = useState([]);
  const [stockMetrics, setStockMetrics] = useState([]);
  const [error, setError] = useState('');

  const chartRef = useRef(null);
  const [showGraph, setShowGraph] = useState(false);
  const chartTitle = tickers.split(',').length === 1 ? 'Stock Chart' : 'Combined Stock Chart';
  const [spMetrics, setSpMetrics] = useState(null);
  const [tickerError, setTickerError] = useState(null);







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
      ctx.width = 600;
      ctx.height = 300;

      const datasets = stockData.map((stock, index) => ({
        label: stock.ticker,
        data: stock.data.map(data => ({ x: data.date, y: data.close })),
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        fill: false
      }));

      const combinedChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: stockData[0] ? stockData[0].data.map(data => data.date) : [],
          datasets: datasets
        },
        options: {
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
  }, [stockData]);


  const formatValue = (value) => {
    if (value < 1e9) {
      return `$${(value / 1e9).toFixed(1)}B`;
    } else {
      return `$${(value / 1e9).toFixed(0)}B`;
    }
  };

  const getBetaColor = (value) => {
    if (value < 0.6 || value > 1.5) {
      return { color: 'red' };
    } else {
    if (value > 0.6 || value < 1.4) {
      return { color: 'rgb(0, 255, 44)' };
      }
    }
    return {};
  };

  const getpercentageColor = (value) => {
    if (value < 0) {
      return { color: 'red' };

    } else {
      if (value > 0) {
        return { color: 'rgb(0, 255, 44)' };
      }
    }
    return {};
  }

  const formatMarketCap = (marketcap) => formatValue(marketcap);
  const formatRevenue = (revenue) => formatValue(revenue);

  const computeAverage = (data, key) => {
    const validData = data.filter(stock => stock.metrics && !isNaN(stock.metrics[key]) && stock.metrics[key] !== null && stock.metrics[key] !== undefined).map(stock => stock.metrics[key]);

    if (validData.length === 0) {
      console.warn(`No valid data found for key: ${key}`);
      return "N/A"; // Return a placeholder if there's no valid data
    }

    const averageYear1ChangePercent = computeAverage(stockMetrics.map(stock => parseFloat(stock.metrics.year1ChangePercent)));


    const averageValue = (validData.reduce((acc, val) => acc + parseFloat(val), 0) / validData.length).toFixed(2);

    // Check if the key is 'dividendYield' and format the value as a percentage
    if (key === 'dividendYield') {
      return `${averageValue}%`; // Return the average with a percentage symbol
    } else {
      return averageValue; // Return the average value as it is
    }
  };

  const calculatePercentageIncrease = (currentPrice, price52WeeksAgo) => {
    if (price52WeeksAgo === 0) {
      return "N/A";  // or any other default value
    }
    return ((currentPrice - price52WeeksAgo) / price52WeeksAgo) * 100;
  };

  const calculateStartDate = (years) => {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear() - years, currentDate.getMonth(), currentDate.getDate());
    return `${startDate.getFullYear()}-01-01`; // Format to "YYYY-01-01" to ensure the data starts from January 1st of that year
  };

  const fetchStockData = async (tickers, years) => {
    const startDate = calculateStartDate(years);

    const tickerList = tickers.split(',').map(ticker => ticker.trim());

    const fetchDataPromises = tickerList.map(async (ticker) => {
        try {
            const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart/1y?range=10y&token=sk_81a9304d8942465cb4e738fca8f2d375`);
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

    const fetchSp500Metrics = async () => {
      try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/SPY/advanced-stats?token=sk_81a9304d8942465cb4e738fca8f2d375`);
          return response.data; // Assuming the response directly contains the S&P 500 metrics
      } catch (error) {
          console.error('Error fetching S&P 500 metrics:', error);
          return null;
      }
  };

    const fetchMetricsPromises = tickerList.map(async (ticker) => {
        try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/advanced-stats?token=sk_81a9304d8942465cb4e738fca8f2d375`);
          const sectorResponse = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/company?token=sk_81a9304d8942465cb4e738fca8f2d375`);
            const chartDataResponse = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart/1y?token=sk_81a9304d8942465cb4e738fca8f2d375`);

            const price52WeeksAgo = chartDataResponse.data[response.data.length - 52]?.close || 0;
            const epsValue = response.data.ttmEPS;
            const parsedEps = parseFloat(epsValue); // corrected parsing

            return {
                ticker,
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
                    year1ChangePercent: parseFloat(response.data.year1ChangePercent * 100).toFixed(2) // Add this line to fetch the year1ChangePercent
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

    // Assuming fetchSp500Metrics is a function that fetches and returns the S&P 500 metrics
    const sp500Data = await fetchSp500Metrics();
    console.log("S&P 500 Data:", sp500Data);
    setSpMetrics(sp500Data);

    setStockData(fetchedData.filter(Boolean));
    setStockMetrics(fetchedMetrics.filter(Boolean));
};


  const handleInputChange = (event) => {
    setTickers(event.target.value.toUpperCase());
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchStockData(tickers);
    setShowGraph(true);  // Set showGraph to true after fetching data
  };
  const handleLogin = () => {
    // Logic for handling login
    console.log('Login clicked');
  };

  const averageYear1ChangePercent = computeAverage(stockMetrics, 'year1ChangePercent');



  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-buttons">
            <button className="big-button">Learn About Finance</button>
            <button className="big-button">Pricing</button>
            <button className="big-button">Login</button>
          </div>
          <img src={logo} className="App-logo" alt="logo" />
          <div className="header-input">
            <input
              type="text"
              placeholder="Enter tickers separated by commas"
              value={tickers}
              onChange={handleInputChange}
              style={{ fontSize: '14px' }}
            />
            <button type="submit" onClick={handleSubmit}>Fetch Data</button>
          </div>
        </div>

        {stockMetrics.length > 0 && (
    <div className="metrics-section">
        <h2>Financial Metrics</h2>
        <table>
        <thead>
          <tr>
              <th>Ticker</th>
              <th>Market Cap</th>
              <th>PE Ratio</th>
              <th>Beta</th>
              <th>Sector</th>
              <th>Dividend Yield</th>
              <th>EPS (TTM)</th>
              <th>Profit Margin</th>
              <th>Revenue</th>
              <th>1-Year Price Increase (%)</th> {/* New column header */}

          </tr>

      </thead>
      <tbody>
    {stockMetrics.map((stock, index) => (

        <>
            <tr key={index} style={{ backgroundColor: 'transparent' }}>
                <td>{stock.ticker}</td>
                <td>{formatMarketCap(stock.metrics.marketcap)}</td>
                <td>{stock.metrics.peRatio}</td>
                <td style={getBetaColor(stock.metrics.beta)}>{stock.metrics.beta}</td>
                <td>{stock.sector}</td>
                <td>{stock.metrics.dividendYield === "0.00" ? "0" : `${stock.metrics.dividendYield}%`}</td>
                <td>{stock.metrics.ttmEPS}</td>
                <td>{stock.metrics.profitMargin}</td>
                <td>{formatRevenue(stock.metrics.revenue)}</td>
                <td style={{ color: getpercentageColor(stock.metrics.year1ChangePercent) }}>{stock.metrics.year1ChangePercent === "N/A" ? "N/A" : `${stock.metrics.year1ChangePercent}%`}
                </td>
                </tr>
            {index < stockMetrics.length - 1 && <tr className="separator-row"><td colSpan="10"></td></tr>}
        </>
    ))}
<tr className="average-row">
    <td>Averages</td>
    <td>{formatMarketCap(parseFloat(computeAverage(stockMetrics, 'marketcap')))}</td>
    <td>{computeAverage(stockMetrics, 'peRatio')}</td>
    <td>{computeAverage(stockMetrics, 'beta')}</td>
    <td>-</td>
    <td>{computeAverage(stockMetrics, 'dividendYield')}</td>
    <td>{computeAverage(stockMetrics, 'ttmEPS')}</td>
    <td>{computeAverage(stockMetrics, 'profitMargin')}</td>
    <td>{formatRevenue(computeAverage(stockMetrics, 'revenue'))}</td>
    <td>{averageYear1ChangePercent === "N/A" ? "N/A" : `${averageYear1ChangePercent}%`}</td> {/* Display the average 1-year price increase percentage */}
</tr>
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

        <td>{spMetrics && spMetrics.year1ChangePercent ? `${(spMetrics.year1ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>

</tr>
)}
</tbody>
</table>
</div>
        )}
{tickerError && <div className="error-message">{tickerError}</div>}

        {showGraph && (
          <div className="graphs-container">
            <div className="stock-graph">
              <h3>{tickers.split(',').length === 1 ? 'Stock Chart' : 'Combined Stock Chart'}</h3>
              <canvas
                id="combinedStockGraph"
                width="1200"
                height="800"
              ></canvas>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
