import { anyspendService } from "@b3dotfun/sdk/anyspend/services/anyspend";

// Order tracking state
let orderStatusInterval = null;

// Transaction details renderer
export function renderTransactionDetails(orderData) {
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

// Order status polling
export function startOrderStatusPolling(orderId) {
  if (orderStatusInterval) {
    clearInterval(orderStatusInterval);
  }

  orderStatusInterval = setInterval(async () => {
    if (!orderId) return;

    try {
      const orderStatusSpan = document.getElementById("orderStatus");
      const statusMessage = document.getElementById("statusMessage");
      const orderInstructions = document.getElementById("orderInstructions");

      // Update status message to show we're checking
      if (statusMessage) {
        statusMessage.textContent = "🔄 Checking order status...";
      }

      const orderData = await anyspendService.getOrderAndTransactions(orderId);

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

export function stopOrderStatusPolling() {
  if (orderStatusInterval) {
    clearInterval(orderStatusInterval);
    orderStatusInterval = null;
  }
}
