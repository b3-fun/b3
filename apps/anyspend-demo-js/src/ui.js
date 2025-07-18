import { formatAmount } from "./utils.js";

// DOM element references
export const loadingDiv = document.getElementById("loading");
export const errorDiv = document.getElementById("error");
export const resultDiv = document.getElementById("result");
export const getQuoteBtn = document.getElementById("getQuoteBtn");

// UI state management
export function showElement(element) {
  element.classList.remove("hidden");
}

export function hideElement(element) {
  element.classList.add("hidden");
}

export function hideAllMessages() {
  hideElement(loadingDiv);
  hideElement(errorDiv);
  hideElement(resultDiv);
}

export function showError(message) {
  hideAllMessages();
  errorDiv.textContent = message;
  showElement(errorDiv);
}

export function showLoading(message = "Loading...") {
  hideAllMessages();
  loadingDiv.textContent = message;
  showElement(loadingDiv);
  getQuoteBtn.disabled = true;
}

export function hideLoading() {
  hideElement(loadingDiv);
  getQuoteBtn.disabled = false;
}

// Quote result display
export function showResult(quoteResponse, dstDecimals, formData, onCreateOrder) {
  hideAllMessages();

  const { data } = quoteResponse;
  console.log(`data`, data);

  // Extract destination amount from currencyOut
  const rawDstAmount = data.currencyOut?.amount || "0";
  const formattedDstAmount = data.currencyOut?.amountFormatted || formatAmount(rawDstAmount, dstDecimals);
  console.log(`formattedDstAmount`, formattedDstAmount);

  // Show detailed result with create order button
  resultDiv.innerHTML = `
        <h3>Quote Result</h3>
        <div class="result-details">
            <strong>Destination Amount:</strong> ${formattedDstAmount}<br>
            <strong>Raw Amount:</strong> ${rawDstAmount}<br>
            <strong>Exchange Rate:</strong> ${data.rate || "N/A"}<br>
            <strong>USD Value:</strong> $${data.currencyOut?.amountUsd || "N/A"}<br>
            <strong>Price Impact:</strong> ${data.totalImpact?.percent || "N/A"}%
        </div>
        <button id="createOrderBtn" class="get-quote-btn" style="margin-top: 15px;">Create Order</button>
    `;
  showElement(resultDiv);

  // Add event listener for create order button
  document.getElementById("createOrderBtn").addEventListener("click", onCreateOrder);
}

// Order details display
export function showOrderDetails(orderResponse, srcAmountEth) {
  hideAllMessages();

  const { data } = orderResponse;
  const globalAddress = data.globalAddress || "N/A";

  resultDiv.innerHTML = `
    <h3>Order Created</h3>
    <div class="result-details">
      <strong>Order ID:</strong> ${data.id}<br>
      <strong>Status:</strong> <span id="orderStatus">${data.status || "pending"}</span><br>
      <strong>Global Address:</strong> ${globalAddress}<br>
    </div>
    <div id="orderInstructions" class="order-cta" style="margin-top: 15px; padding: 15px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3;">
      <strong>Next Step:</strong> Send ${srcAmountEth} ETH on Base to:<br>
      <code style="background: white; padding: 5px; border-radius: 4px; display: inline-block; margin-top: 5px; word-break: break-all;">${globalAddress}</code>
    </div>
    <div id="transactionDetails" style="margin-top: 15px;"></div>
    <div id="orderStatusLoader" style="margin-top: 10px; padding: 10px; background: #f8f9ff; border-radius: 6px; color: #667eea; font-size: 0.9rem;">
      <span id="statusMessage">🔄 Monitoring order status...</span>
    </div>
  `;
  showElement(resultDiv);
}
