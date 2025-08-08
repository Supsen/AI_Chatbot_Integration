


// Function to get real-time cryptocurrency price from CoinMarketCap
async function getCryptoPrice(symbol) {
  try {
    const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`, {
      params: { symbol, convert: "USD" },
      headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY }
    });
    const price = response.data.data[symbol].quote.USD.price;
    return `The current price of ${symbol} is **$${price.toFixed(2)} USD**.`;
  } catch (error) {
    return "Sorry, I couldn't fetch the cryptocurrency price at the moment.";
  }
}

// Function to get latest stock closing price from MarketStack
async function getStockPrice(symbol) {
  try {
    const response = await axios.get(`http://api.marketstack.com/v1/eod`, {
      params: { access_key: process.env.MARKETSTACK_API_KEY, symbols: symbol }
    });
    const stockData = response.data.data[0]; // Most recent EOD
    return `The last closing price of ${symbol.toUpperCase()} was **$${stockData.close}
        ** on ${stockData.date.split("T")[0]}.`;
  } catch (error) {
    return "Failed to retrieve stock price data.";
  }
}

// Function to get currency exchange rate from Frankfurter API
async function getCurrencyExchangeRate(base = "USD", target = "THB") {
  try {
    const response = await axios.get("https://api.frankfurter.app/latest", {
      params: { from: base, to: target }
    });
    const rate = response.data.rates[target.toUpperCase()];
    return `1 ${base} = ${rate.toFixed(2)} ${target} (as of ${response.data.date})`;
  } catch (error) {
    return `Failed to fetch exchange rate from ${base} to ${target}.`;
  }
}

// Function to calculate monthly loan payment
function calculateLoanPayment(loanAmount, interestRate, years) {
  const monthlyRate = (interestRate / 100) / 12;
  const months = years * 12;
  const payment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return `For a loan of **$${loanAmount.toFixed(2)}** at an interest rate of **${interestRate}%
    **, your monthly payment over **${years} years** is **$${payment.toFixed(2)}**.`;
}