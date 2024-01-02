import React, { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
import './App.css';
import Chart from 'chart.js/auto';
import axios from 'axios';
import 'chartjs-adapter-date-fns';
import FinanceDefinitions from './financedefinitions.js'; // Import the FinanceDefinitions component


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
  const [legendFontSize, setLegendFontSize] = useState(30); // Default font size set to 14








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
      ctx.width = 1500;
      ctx.height = 900;

      const datasets = stockData.map((stock, index) => ({
        label: stock.ticker || 'S&P 500',
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
  }, [stockData, showGraph, spMetrics]);

  const [showDefinitions, setShowDefinitions] = useState(false);



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
      return 'red';
    } else if (value > 0) {
      return 'rgb(0, 255, 44)';
    }
    return 'inherit';
  }

  const [showLearnMore, setShowLearnMore] = useState(false);


  const formatMarketCap = (marketcap) => formatValue(marketcap);
  const formatRevenue = (revenue) => formatValue(revenue);

  const computeAverage = (data, key) => {
    const validData = data.filter(stock => stock.metrics && !isNaN(stock.metrics[key]) && stock.metrics[key] !== null && stock.metrics[key] !== undefined).map(stock => stock.metrics[key]);

    if (validData.length === 0) {
      console.warn(`No valid data found for key: ${key}`);
      return "N/A"; // Return a placeholder if there's no valid data
    }
    const averagemaxChangePercent = computeAverage(stockMetrics.map(stock => parseFloat(stock.metrics.maxChangePercent)));
    const averageYear5ChangePercent = computeAverage(stockMetrics.map(stock => parseFloat(stock.metrics.year5ChangePercent)));
    const averageYear1ChangePercent = computeAverage(stockMetrics.map(stock => parseFloat(stock.metrics.year1ChangePercent)));
    const averageMonth6ChangePercent = computeAverage(stockMetrics.map(stock => parseFloat(stock.metrics.month6ChangePercent)));
    const averageDay5ChangePercent = computeAverage(stockMetrics.map(stock => parseFloat(stock.metrics.day5ChangePercent)));


    const averageValue = (validData.reduce((acc, val) => acc + parseFloat(val), 0) / validData.length).toFixed(2);

    // Check if the key is 'dividendYield' and format the value as a percentage
    if (key === 'dividendYield') {
      return `${averageValue}%`; // Return the average with a percentage symbol
    } else {
      return averageValue; // Return the average value as it is
    }
  };





  const fetchStockData = async (tickers, years) => {

    const tickerList = tickers.split(',').map(ticker => ticker.trim());

    const fetchDataPromises = tickerList.map(async (ticker) => {
        try {
            const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart/1y?range=10y&token=sk_399e63b2a3354cb0ba768c04cbe7ad92`);
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
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/SPY/advanced-stats?token=sk_399e63b2a3354cb0ba768c04cbe7ad92`);
          return response.data;

      } catch (error) {
          console.error('Error fetching S&P 500 metrics:', error);
          return null;
      }
  };

    const fetchMetricsPromises = tickerList.map(async (ticker) => {
        try {
          const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/advanced-stats?token=sk_399e63b2a3354cb0ba768c04cbe7ad92`);
          const sectorResponse = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/company?token=sk_399e63b2a3354cb0ba768c04cbe7ad92`);
            const chartDataResponse = await axios.get(`https://cloud.iexapis.com/stable/stock/${ticker}/chart/1y?token=sk_399e63b2a3354cb0ba768c04cbe7ad92`);

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

    // Assuming fetchSp500Metrics is a function that fetches and returns the S&P 500 metrics
    const sp500Data = await fetchSp500Metrics();
    console.log("S&P 500 Data:", sp500Data);
    setSpMetrics(sp500Data);

    setStockData(fetchedData.filter(Boolean));
    setStockMetrics(fetchedMetrics.filter(Boolean));
};


  const handleInputChange = (event) => {
    setTickers(event.target.value.toUpperCase());
    const inputFontSize = 40; // Set the desired font size for the legend
    setLegendFontSize(inputFontSize);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchStockData(tickers);
    setShowLearnMore(true);
    setShowGraph(true);  // Set showGraph to true after fetching data

  };
  const handleLogin = () => {
    // Logic for handling login
    console.log('Login clicked');
    setShowDefinitions(true);
  };

  const handleCloseDefinitions = () => {
    setShowDefinitions(false);
};

  const averagemaxChangePercent = computeAverage(stockMetrics, 'maxChangePercent');
  const averageYear5ChangePercent = computeAverage(stockMetrics, 'year5ChangePercent');
  const averageYear1ChangePercent = computeAverage(stockMetrics, 'year1ChangePercent');
  const averageMonth6ChangePercent = computeAverage(stockMetrics, 'month6ChangePercent');
  const averageDay5ChangePercent = computeAverage(stockMetrics, 'day5ChangePercent');




  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-buttons">
          <button className="big-button" onClick={handleLogin}>Learn About Finance</button>
            <button className="big-button">Pricing</button>
            <button className="big-button">PortfolioPro</button>
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
            <button type="submit" onClick={handleSubmit} style={{ fontSize: '1.5em', padding: '10px 20px' }}>Show stocks</button>
          </div>
        </div>
        {showDefinitions && <FinanceDefinitions onClose={handleCloseDefinitions} />}

        {stockMetrics.length > 0 && (
    <div className="metrics-section">
        <h2>Your Portfolio's Financial Metrics</h2>
        <table>
        <thead>
          <tr>
              <th>Ticker</th>
              <th>Sector</th>
              <th>Market Cap</th>
              <th>PE Ratio</th>
              <th>Beta</th>
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

        <>
            <tr key={index} style={{ backgroundColor: 'transparent' }}>
                <td>{stock.ticker}</td>
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
            {index < stockMetrics.length - 1 && <tr className="separator-row"><td colSpan="14"></td></tr>}
        </>
    ))}
<tr className="average-row">
    <td>Averages</td>
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
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.maxChangePercent) }}>{spMetrics && spMetrics.maxChangePercent ? `${(spMetrics.maxChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.year5ChangePercent) }}>{spMetrics && spMetrics.year5ChangePercent ? `${(spMetrics.year5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.year1ChangePercent) }}>{spMetrics && spMetrics.year1ChangePercent ? `${(spMetrics.year1ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.month6ChangePercent) }}>{spMetrics && spMetrics.month6ChangePercent ? `${(spMetrics.month6ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>
        <td style={{ color: getpercentageColor(spMetrics && spMetrics.day5ChangePercent) }}>{spMetrics && spMetrics.day5ChangePercent ? `${(spMetrics.day5ChangePercent * 100).toFixed(2)}%` : "N/A"}</td>


</tr>
)}
</tbody>
</table>
</div>
        )}

{showLearnMore && (
        <li style={{ listStyleType: 'none', fontSize: '1.5em', marginTop: '20px' }}>
          To learn more about the financial metrics above, please click the<span style={{ textDecoration: 'underline', fontWeight: 'bold' }}>Learn About Finance</span> Button.
        </li>
      )}


{showGraph && (
  <div className="graphs-container">
    <div className="stock-graph">
      <h3>{tickers.split(',').length === 5 ? 'Stock Chart' : 'Combined Stock Chart'}</h3>
      <canvas
        id="combinedStockGraph"
        width="5500"   // Adjusted width for a bigger chart
        height="5000"  // Adjusted height for a bigger chart
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
