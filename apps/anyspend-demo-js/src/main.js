import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";

// DOM elements
const form = document.getElementById("quoteForm");
const loadingDiv = document.getElementById("loading");
const errorDiv = document.getElementById("error");
const resultDiv = document.getElementById("result");
const getQuoteBtn = document.getElementById("getQuoteBtn");

// Global variables for order tracking
let currentQuoteData = null;
let currentOrderId = null;
let orderStatusInterval = null;

// Utility functions
function isValidEvmAddress(address) {
  // Check if address is a valid EVM address (42 characters, starts with 0x, valid hex)
  if (!address || typeof address !== "string") {
    return false;
  }

  // Remove whitespace and convert to lowercase
  const cleanAddress = address.trim().toLowerCase();

  // Check format: 0x followed by 40 hex characters
  const evmAddressRegex = /^0x[a-f0-9]{40}$/;
  return evmAddressRegex.test(cleanAddress);
}

function showElement(element) {
  element.classList.remove("hidden");
}

function hideElement(element) {
  element.classList.add("hidden");
}

function hideAllMessages() {
  hideElement(loadingDiv);
  hideElement(errorDiv);
  hideElement(resultDiv);
}

function showError(message) {
  hideAllMessages();
  errorDiv.textContent = message;
  showElement(errorDiv);
}

function showLoading(message = "Loading...") {
  hideAllMessages();
  loadingDiv.textContent = message;
  showElement(loadingDiv);
  getQuoteBtn.disabled = true;
}

function hideLoading() {
  hideElement(loadingDiv);
  getQuoteBtn.disabled = false;
}

function formatAmount(amount, decimals) {
  try {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** Number(decimals));
    const wholePart = num / divisor;
    const fractionalPart = num % divisor;

    if (fractionalPart === 0n) {
      return wholePart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(Number(decimals), "0");
    const trimmedFractional = fractionalStr.replace(/0+$/, "");

    if (trimmedFractional === "") {
      return wholePart.toString();
    }

    return `${wholePart.toString()}.${trimmedFractional}`;
  } catch (error) {
    return amount;
  }
}

function showResult(quoteResponse, dstDecimals, formData) {
  hideAllMessages();

  const { data } = quoteResponse;
  console.log(`data`, data);

  // Store quote data for order creation
  currentQuoteData = { quoteResponse, dstDecimals, formData };

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
  document.getElementById("createOrderBtn").addEventListener("click", handleCreateOrder);
}

async function handleFormSubmit(event) {
  event.preventDefault();

  // Get form data
  const formData = new FormData(form);
  const srcAmountEth = parseFloat(formData.get("srcAmount"));

  // Convert ETH amount to wei (multiply by 1e18)
  const srcAmountWei = Math.floor(srcAmountEth * 1e18).toString();

  const recipientAddress = formData.get("recipientAddress").trim();

  const data = {
    srcChain: parseInt(formData.get("srcChain")),
    dstChain: parseInt(formData.get("dstChain")),
    srcTokenAddress: formData.get("srcTokenAddress").trim(),
    srcTokenDecimals: 18, // ETH has 18 decimals
    dstTokenAddress: formData.get("dstTokenAddress").trim(),
    dstTokenDecimals: 6, // USDC has 6 decimals
    srcAmount: srcAmountWei,
    recipientAddress: recipientAddress,
    isMainnet: true, // Always use mainnet
  };

  // Validate source amount
  if (!srcAmountEth || srcAmountEth <= 0) {
    showError("Please enter a valid source amount");
    return;
  }

  // Validate recipient address
  if (!isValidEvmAddress(recipientAddress)) {
    showError("Please enter a valid EVM address (0x followed by 40 hex characters)");
    return;
  }

  try {
    showLoading("Getting quote...");

    // Prepare quote request
    const quoteRequest = {
      type: "swap",
      srcChain: data.srcChain,
      dstChain: data.dstChain,
      srcTokenAddress: data.srcTokenAddress,
      dstTokenAddress: data.dstTokenAddress,
      tradeType: "EXACT_INPUT",
      amount: data.srcAmount,
    };

    console.log("Quote request:", quoteRequest);
    console.log(`Converting ${srcAmountEth} ETH to ${srcAmountWei} wei`);

    // Get quote from anyspend service
    const quoteResponse = await anyspendService.getQuote(data.isMainnet, quoteRequest);

    console.log("Quote response:", quoteResponse);

    if (quoteResponse.success) {
      showResult(quoteResponse, data.dstTokenDecimals, formData);
    } else {
      showError(quoteResponse.message || "Failed to get quote");
    }
  } catch (error) {
    console.error("Error getting quote:", error);
    showError(error.message || "An error occurred while getting the quote");
  } finally {
    hideLoading();
  }
}

async function handleCreateOrder() {
  if (!currentQuoteData) {
    showError("No quote data available. Please get a quote first.");
    return;
  }

  // Show loading state on the create order button
  const createOrderBtn = document.getElementById("createOrderBtn");
  if (createOrderBtn) {
    createOrderBtn.disabled = true;
    createOrderBtn.textContent = "Creating order...";
  }

  try {
    const { formData } = currentQuoteData;
    const srcAmountEth = parseFloat(formData.get("srcAmount"));
    const srcAmountWei = Math.floor(srcAmountEth * 1e18).toString();

    // Get quote data for expected amounts and token info
    const { quoteResponse } = currentQuoteData;
    const quoteData = quoteResponse.data;

    // Prepare order creation request with proper payload and metadata
    const orderRequest = {
      recipientAddress: formData.get("recipientAddress").trim(),
      type: "swap",
      srcChain: parseInt(formData.get("srcChain")),
      dstChain: parseInt(formData.get("dstChain")),
      srcTokenAddress: formData.get("srcTokenAddress").trim(),
      dstTokenAddress: formData.get("dstTokenAddress").trim(),
      srcAmount: srcAmountWei,
      payload: {
        expectedDstAmount: quoteData.currencyOut?.amount || "0",
        actualDstAmount: null,
      },
      metadata: {
        srcToken: {
          chainId: quoteData.currencyIn?.currency?.chainId || parseInt(formData.get("srcChain")),
          address: formData.get("srcTokenAddress").trim(),
          symbol: quoteData.currencyIn?.currency?.symbol || "ETH",
          name: quoteData.currencyIn?.currency?.name || "Ether",
          decimals: quoteData.currencyIn?.currency?.decimals || 18,
          metadata: {
            logoURI: quoteData.currencyIn?.currency?.metadata?.logoURI || "",
          },
        },
        dstToken: {
          chainId: quoteData.currencyOut?.currency?.chainId || parseInt(formData.get("dstChain")),
          address: formData.get("dstTokenAddress").trim(),
          symbol: quoteData.currencyOut?.currency?.symbol || "USDC",
          name: quoteData.currencyOut?.currency?.name || "USD Coin",
          decimals: quoteData.currencyOut?.currency?.decimals || 6,
          metadata: {
            logoURI: quoteData.currencyOut?.currency?.metadata?.logoURI || "",
          },
        },
        fromApp: "anyspend-demo-js",
      },
    };

    console.log("Creating order:", orderRequest);

    // Create order using anyspend service
    const orderResponse = await anyspendService.createOrder({
      isMainnet: true,
      ...orderRequest,
    });

    console.log("Order response:", orderResponse);

    if (orderResponse.success) {
      currentOrderId = orderResponse.data.id;
      showOrderDetails(orderResponse, srcAmountEth);
      startOrderStatusPolling();
    } else {
      showError(orderResponse.message || "Failed to create order");
      // Reset button state on error
      if (createOrderBtn) {
        createOrderBtn.disabled = false;
        createOrderBtn.textContent = "Create Order";
      }
    }
  } catch (error) {
    console.error("Error creating order:", error);
    showError(error.message || "An error occurred while creating the order");
    // Reset button state on error
    if (createOrderBtn) {
      createOrderBtn.disabled = false;
      createOrderBtn.textContent = "Create Order";
    }
  }
}

function renderTransactionDetails(orderData) {
  const transactionDetailsDiv = document.getElementById("transactionDetails");
  if (!transactionDetailsDiv || !orderData) return;

  let transactionsHtml = "";

  // Deposit Transactions
  if (orderData.depositTxs && orderData.depositTxs.length > 0) {
    transactionsHtml += `
      <div style="margin-bottom: 15px; padding: 15px; background: #f0f8ff; border-radius: 6px; border-left: 4px solid #007bff;">
        <strong>💰 Deposit Transactions</strong>
        ${orderData.depositTxs
          .map(
            tx => `
          <div style="margin-top: 10px; font-size: 0.9rem;">
            <strong>Amount:</strong> ${tx.amount}<br>
            <strong>From:</strong> <code style="font-size: 0.8rem;">${tx.from}</code><br>
            <strong>Chain:</strong> ${tx.chain}<br>
            <strong>Tx Hash:</strong> <a href="#" style="color: #007bff; font-size: 0.8rem; word-break: break-all;">${tx.txHash}</a><br>
            <strong>Time:</strong> ${new Date(tx.createdAt).toLocaleString()}
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  // Relay Transaction
  if (orderData.relayTx) {
    const relayTx = orderData.relayTx;
    const statusColor = relayTx.status === "success" ? "#28a745" : relayTx.status === "failure" ? "#dc3545" : "#ffc107";
    transactionsHtml += `
      <div style="margin-bottom: 15px; padding: 15px; background: #f8fff0; border-radius: 6px; border-left: 4px solid ${statusColor};">
        <strong>🔄 Relay Transaction</strong>
        <div style="margin-top: 10px; font-size: 0.9rem;">
          <strong>Status:</strong> <span style="color: ${statusColor};">${relayTx.status}</span><br>
          <strong>Chain:</strong> ${relayTx.chain}<br>
          <strong>Tx Hash:</strong> <a href="#" style="color: #007bff; font-size: 0.8rem; word-break: break-all;">${relayTx.txHash}</a><br>
          <strong>Time:</strong> ${new Date(relayTx.createdAt).toLocaleString()}
        </div>
      </div>
    `;
  }

  // Execute Transaction
  if (orderData.executeTx) {
    const executeTx = orderData.executeTx;
    transactionsHtml += `
      <div style="margin-bottom: 15px; padding: 15px; background: #f0fff4; border-radius: 6px; border-left: 4px solid #28a745;">
        <strong>✅ Execute Transaction</strong>
        <div style="margin-top: 10px; font-size: 0.9rem;">
          <strong>Chain:</strong> ${executeTx.chain}<br>
          <strong>Tx Hash:</strong> <a href="#" style="color: #007bff; font-size: 0.8rem; word-break: break-all;">${executeTx.txHash}</a><br>
          <strong>Time:</strong> ${new Date(executeTx.createdAt).toLocaleString()}
        </div>
      </div>
    `;
  }

  // Refund Transactions (if any)
  if (orderData.refundTxs && orderData.refundTxs.length > 0) {
    transactionsHtml += `
      <div style="margin-bottom: 15px; padding: 15px; background: #fff8f0; border-radius: 6px; border-left: 4px solid #ffc107;">
        <strong>↩️ Refund Transactions</strong>
        ${orderData.refundTxs
          .map(
            tx => `
          <div style="margin-top: 10px; font-size: 0.9rem;">
            <strong>Amount:</strong> ${tx.amount}<br>
            <strong>Status:</strong> ${tx.status}<br>
            <strong>Chain:</strong> ${tx.chain}<br>
            <strong>Tx Hash:</strong> <a href="#" style="color: #007bff; font-size: 0.8rem; word-break: break-all;">${tx.txHash}</a><br>
            <strong>Time:</strong> ${new Date(tx.createdAt).toLocaleString()}
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  transactionDetailsDiv.innerHTML = transactionsHtml;
}

function showOrderDetails(orderResponse, srcAmountEth) {
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

function startOrderStatusPolling() {
  if (orderStatusInterval) {
    clearInterval(orderStatusInterval);
  }

  orderStatusInterval = setInterval(async () => {
    if (!currentOrderId) return;

    try {
      const orderStatusSpan = document.getElementById("orderStatus");
      const statusMessage = document.getElementById("statusMessage");
      const orderInstructions = document.getElementById("orderInstructions");

      // Update status message to show we're checking
      if (statusMessage) {
        statusMessage.textContent = "🔄 Checking order status...";
      }

      const orderData = await anyspendService.getOrderAndTransactions(true, currentOrderId);

      if (orderData.success && orderData.data) {
        const status = orderData.data.order?.status || "pending";

        // Update status display
        if (orderStatusSpan) {
          orderStatusSpan.textContent = status;
        }

        // Update transaction details
        renderTransactionDetails(orderData.data);

        // Update UI based on status
        if (status === "executed" || status === "completed") {
          // Order completed successfully
          if (statusMessage) {
            statusMessage.innerHTML = "✅ Order completed successfully!";
          }
          if (orderInstructions) {
            orderInstructions.innerHTML = `
              <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745;">
                <strong>✅ Order Completed!</strong><br>
                Your swap has been executed successfully. The USDC should now be in the recipient address.
              </div>
            `;
          }
          clearInterval(orderStatusInterval);
          orderStatusInterval = null;
        } else if (status === "failure" || status === "refunded") {
          // Order failed
          if (statusMessage) {
            statusMessage.innerHTML = "❌ Order failed or was refunded";
          }
          if (orderInstructions) {
            orderInstructions.innerHTML = `
              <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; border-left: 4px solid #dc3545;">
                <strong>❌ Order Failed</strong><br>
                The order could not be completed. If you sent funds, they should be refunded automatically.
              </div>
            `;
          }
          clearInterval(orderStatusInterval);
          orderStatusInterval = null;
        } else {
          // Order still pending
          if (statusMessage) {
            statusMessage.innerHTML = `🔄 Order status: ${status} - Next check in 5 seconds...`;
          }
        }
      } else {
        if (statusMessage) {
          statusMessage.textContent = "⚠️ Unable to fetch order status - retrying...";
        }
      }
    } catch (error) {
      console.error("Error polling order status:", error);
      const statusMessage = document.getElementById("statusMessage");
      if (statusMessage) {
        statusMessage.textContent = "⚠️ Error checking status - retrying...";
      }
    }
  }, 5000); // Poll every 5 seconds
}

// Real-time validation for recipient address
function setupAddressValidation() {
  const recipientInput = document.getElementById("recipientAddress");
  if (recipientInput) {
    recipientInput.addEventListener("input", function () {
      const address = this.value.trim();

      // Only validate if user has entered something
      if (address.length > 0) {
        if (isValidEvmAddress(address)) {
          // Valid address
          this.style.borderColor = "#28a745";
          this.style.boxShadow = "0 0 0 3px rgba(40, 167, 69, 0.1)";
        } else {
          // Invalid address
          this.style.borderColor = "#dc3545";
          this.style.boxShadow = "0 0 0 3px rgba(220, 53, 69, 0.1)";
        }
      } else {
        // Reset to default styling
        this.style.borderColor = "#e1e8ed";
        this.style.boxShadow = "";
      }
    });
  }
}

// Event listeners
form.addEventListener("submit", handleFormSubmit);

// Initialize address validation on page load
document.addEventListener("DOMContentLoaded", setupAddressValidation);
