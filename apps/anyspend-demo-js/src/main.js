import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";
import "./addressValidation.js"; // Auto-setup address validation
import { startOrderStatusPolling } from "./orderTracking.js";
import { hideLoading, showError, showLoading, showOrderDetails, showResult } from "./ui.js";
import { isValidEvmAddress } from "./utils.js";

// Global variables for quote and order tracking
let currentQuoteData = null;
let currentOrderId = null;

// Core AnySpend functionality: Get Quote
async function handleFormSubmit(event) {
  event.preventDefault();

  // Get form data
  const form = document.getElementById("quoteForm");
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
    const quoteResponse = await anyspendService.getQuote(quoteRequest);

    console.log("Quote response:", quoteResponse);

    if (quoteResponse.success) {
      // Store quote data for order creation
      currentQuoteData = { quoteResponse, dstDecimals: data.dstTokenDecimals, formData };
      showResult(quoteResponse, data.dstTokenDecimals, formData, handleCreateOrder);
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

// Core AnySpend functionality: Create Order
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
    const orderResponse = await anyspendService.createOrder(orderRequest);

    console.log("Order response:", orderResponse);

    if (orderResponse.success) {
      currentOrderId = orderResponse.data.id;
      showOrderDetails(orderResponse, srcAmountEth);
      startOrderStatusPolling(currentOrderId);
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

// Initialize form submission handler
const form = document.getElementById("quoteForm");
form.addEventListener("submit", handleFormSubmit);
