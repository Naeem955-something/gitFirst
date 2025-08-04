// Global variables
let cartItems = [];
let requestHistory = [];
let currentTab = "cart";

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
});

// Tab management
function showTab(tabName) {
  currentTab = tabName;

  // Update tab buttons
  const cartTab = document.getElementById("cartTab");
  const historyTab = document.getElementById("historyTab");

  if (tabName === "cart") {
    cartTab.className =
      "py-4 px-1 border-b-2 border-blue-500 font-medium text-blue-600";
    historyTab.className =
      "py-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700";
  } else {
    cartTab.className =
      "py-4 px-1 border-b-2 border-transparent font-medium text-gray-500 hover:text-gray-700";
    historyTab.className =
      "py-4 px-1 border-b-2 border-blue-500 font-medium text-blue-600";
  }

  // Show/hide content
  const cartContent = document.getElementById("cartContent");
  const historyContent = document.getElementById("historyContent");

  if (tabName === "cart") {
    cartContent.classList.remove("hidden");
    historyContent.classList.add("hidden");
    loadCart();
  } else {
    cartContent.classList.add("hidden");
    historyContent.classList.remove("hidden");
    loadRequestHistory();
  }
}

// Load cart items
async function loadCart() {
  try {
    const response = await fetch("/patient/refill-cart");
    if (!response.ok) {
      throw new Error("Failed to load cart");
    }

    cartItems = await response.json();
    renderCart();
  } catch (error) {
    console.error("Error loading cart:", error);
    showError("Failed to load cart. Please try again.");
  }
}

// Render cart
function renderCart() {
  const cartLoading = document.getElementById("cartLoading");
  const emptyCart = document.getElementById("emptyCart");
  const cartItemsDiv = document.getElementById("cartItems");
  const cartTableBody = document.getElementById("cartTableBody");
  const cartCount = document.getElementById("cartCount");

  cartLoading.classList.add("hidden");

  if (cartItems.length === 0) {
    emptyCart.classList.remove("hidden");
    cartItemsDiv.classList.add("hidden");
    cartCount.textContent = "0";
    return;
  }

  emptyCart.classList.add("hidden");
  cartItemsDiv.classList.remove("hidden");
  cartCount.textContent = cartItems.length.toString();

  cartTableBody.innerHTML = "";
  let totalAmount = 0;

  cartItems.forEach((item) => {
    const row = document.createElement("tr");
    row.className = "border-b border-gray-200 hover:bg-gray-50";

    const totalPrice = (item.price || 0) * item.quantity;
    totalAmount += totalPrice;

    row.innerHTML = `
      <td class="px-6 py-4">
        <div>
          <div class="font-medium text-gray-900">${item.medicine_name}</div>
          <div class="text-sm text-gray-500">${item.timing} • ${
      item.duration
    }</div>
        </div>
      </td>
      <td class="px-6 py-4">${item.dosage || "-"}</td>
      <td class="px-6 py-4">Dr. ${item.doctor_name}</td>
      <td class="px-6 py-4">
        <div class="flex items-center space-x-2">
          <button
            onclick="updateQuantity(${item.id}, ${item.quantity - 1})"
            class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
          >
            -
          </button>
          <span class="w-8 text-center">${item.quantity}</span>
          <button
            onclick="updateQuantity(${item.id}, ${item.quantity + 1})"
            class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
          >
            +
          </button>
        </div>
      </td>
      <td class="px-6 py-4">৳${item.price || 0}</td>
      <td class="px-6 py-4 font-medium">৳${totalPrice}</td>
      <td class="px-6 py-4">
        <button
          onclick="removeFromCart(${item.id})"
          class="text-red-600 hover:text-red-800"
        >
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    cartTableBody.appendChild(row);
  });

  // Update summary
  document.getElementById("totalItems").textContent = cartItems.length;
  document.getElementById("totalAmount").textContent = totalAmount;
}

// Update quantity
async function updateQuantity(cartId, newQuantity) {
  if (newQuantity <= 0) {
    await removeFromCart(cartId);
    return;
  }

  try {
    const response = await fetch("/patient/refill-cart", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cart_id: cartId,
        quantity: newQuantity,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update quantity");
    }

    await loadCart();
  } catch (error) {
    console.error("Error updating quantity:", error);
    showError("Failed to update quantity.");
  }
}

// Remove from cart
async function removeFromCart(cartId) {
  try {
    const response = await fetch(`/patient/refill-cart/${cartId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to remove item");
    }

    await loadCart();
    showSuccess("Item removed from cart");
  } catch (error) {
    console.error("Error removing from cart:", error);
    showError("Failed to remove item from cart.");
  }
}

// Clear cart
async function clearCart() {
  if (!confirm("Are you sure you want to clear your cart?")) {
    return;
  }

  try {
    const response = await fetch("/patient/refill-cart", {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to clear cart");
    }

    await loadCart();
    showSuccess("Cart cleared successfully");
  } catch (error) {
    console.error("Error clearing cart:", error);
    showError("Failed to clear cart.");
  }
}

// Show checkout modal
function showCheckoutModal() {
  if (cartItems.length === 0) {
    showError("Your cart is empty");
    return;
  }

  // Populate checkout summary
  const checkoutSummary = document.getElementById("checkoutSummary");
  let totalAmount = 0;

  const summaryHtml =
    cartItems
      .map((item) => {
        const totalPrice = (item.price || 0) * item.quantity;
        totalAmount += totalPrice;

        return `
      <div class="flex justify-between py-1">
        <span>${item.medicine_name} x${item.quantity}</span>
        <span>৳${totalPrice}</span>
      </div>
    `;
      })
      .join("") +
    `
    <div class="border-t pt-2 mt-2">
      <div class="flex justify-between font-semibold">
        <span>Total</span>
        <span>৳${totalAmount}</span>
      </div>
    </div>
  `;

  checkoutSummary.innerHTML = summaryHtml;

  // Show modal
  const modal = document.getElementById("checkoutModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Close checkout modal
function closeCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");

  // Reset form
  document.getElementById("checkoutForm").reset();
}

// Submit refill request
async function submitRefillRequest() {
  const form = document.getElementById("checkoutForm");
  const formData = new FormData(form);

  const address = formData.get("address");
  const notes = formData.get("notes");

  if (!address.trim()) {
    showError("Please enter a delivery address");
    return;
  }

  try {
    const response = await fetch("/patient/refill-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: address.trim(),
        notes: notes.trim(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit request");
    }

    const result = await response.json();
    closeCheckoutModal();
    await loadCart();
    showSuccess(
      `Refill request submitted successfully! Request ID: ${result.request_id}`
    );

    // Switch to history tab to show the new request
    showTab("history");
  } catch (error) {
    console.error("Error submitting request:", error);
    showError(error.message || "Failed to submit refill request");
  }
}

// Load request history
async function loadRequestHistory() {
  try {
    const response = await fetch("/patient/refill-requests");
    if (!response.ok) {
      throw new Error("Failed to load request history");
    }

    requestHistory = await response.json();
    renderRequestHistory();
  } catch (error) {
    console.error("Error loading request history:", error);
    showError("Failed to load request history. Please try again.");
  }
}

// Render request history
function renderRequestHistory() {
  const historyLoading = document.getElementById("historyLoading");
  const emptyHistory = document.getElementById("emptyHistory");
  const requestHistoryDiv = document.getElementById("requestHistory");
  const historyTableBody = document.getElementById("historyTableBody");

  historyLoading.classList.add("hidden");

  if (requestHistory.length === 0) {
    emptyHistory.classList.remove("hidden");
    requestHistoryDiv.classList.add("hidden");
    return;
  }

  emptyHistory.classList.add("hidden");
  requestHistoryDiv.classList.remove("hidden");

  historyTableBody.innerHTML = "";

  requestHistory.forEach((request) => {
    const row = document.createElement("tr");
    row.className = "border-b border-gray-200 hover:bg-gray-50";

    const statusClass = getStatusClass(request.status);

    row.innerHTML = `
      <td class="px-6 py-4 font-medium">RR${request.request_id
        .toString()
        .padStart(5, "0")}</td>
      <td class="px-6 py-4">${formatDate(request.submitted_at)}</td>
      <td class="px-6 py-4">${request.item_count} items</td>
      <td class="px-6 py-4">
        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
          ${request.status}
        </span>
      </td>
      <td class="px-6 py-4">
        <button
          onclick="viewRequestDetails(${request.request_id})"
          class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
        >
          View Details
        </button>
      </td>
    `;

    historyTableBody.appendChild(row);
  });
}

// Get status class for styling
function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "delivered":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// View request details
async function viewRequestDetails(requestId) {
  try {
    const response = await fetch(`/patient/refill-request/${requestId}`);
    if (!response.ok) {
      throw new Error("Failed to load request details");
    }

    const data = await response.json();
    renderRequestDetailsModal(data);
    showRequestDetailsModal();
  } catch (error) {
    console.error("Error loading request details:", error);
    showError("Failed to load request details.");
  }
}

// Render request details modal
function renderRequestDetailsModal(data) {
  const modalContent = document.getElementById("requestDetails");

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr class="border-b border-gray-200">
      <td class="px-4 py-3">${item.medicine_name}</td>
      <td class="px-4 py-3">${item.dosage || "-"}</td>
      <td class="px-4 py-3">${item.timing || "-"}</td>
      <td class="px-4 py-3">${item.duration || "-"}</td>
      <td class="px-4 py-3">${item.quantity}</td>
      <td class="px-4 py-3">৳${item.unit_price || 0}</td>
      <td class="px-4 py-3 font-medium">৳${item.total_price || 0}</td>
    </tr>
  `
    )
    .join("");

  const totalAmount = data.items.reduce(
    (sum, item) => sum + (item.total_price || 0),
    0
  );

  modalContent.innerHTML = `
    <div class="space-y-6">
      <!-- Request Header -->
      <div class="bg-blue-50 p-4 rounded-lg">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-semibold text-blue-700">Request Information</h3>
            <p><strong>Request ID:</strong> RR${data.request.request_id
              .toString()
              .padStart(5, "0")}</p>
            <p><strong>Date:</strong> ${formatDate(
              data.request.submitted_at
            )}</p>
            <p><strong>Status:</strong> 
              <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                data.request.status
              )}">
                ${data.request.status}
              </span>
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-blue-700">Delivery Information</h3>
            <p><strong>Address:</strong> ${data.request.address}</p>
            ${
              data.request.delivery_method
                ? `<p><strong>Method:</strong> ${data.request.delivery_method}</p>`
                : ""
            }
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${
        data.request.notes
          ? `
        <div>
          <h3 class="font-semibold text-gray-700 mb-2">Notes</h3>
          <p class="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
            ${data.request.notes}
          </p>
        </div>
      `
          : ""
      }

      <!-- Items -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-2">Requested Items</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-100">
              <tr>
                <th class="px-4 py-2 text-left">Medicine</th>
                <th class="px-4 py-2 text-left">Dosage</th>
                <th class="px-4 py-2 text-left">Timing</th>
                <th class="px-4 py-2 text-left">Duration</th>
                <th class="px-4 py-2 text-left">Quantity</th>
                <th class="px-4 py-2 text-left">Unit Price</th>
                <th class="px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Total -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex justify-end">
          <div class="text-right">
            <p class="text-lg font-semibold text-blue-700">Total Amount: ৳${totalAmount}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Show request details modal
function showRequestDetailsModal() {
  const modal = document.getElementById("requestDetailsModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

// Close request details modal
function closeRequestDetailsModal() {
  const modal = document.getElementById("requestDetailsModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

// Show success message
function showSuccess(message) {
  // You can implement a toast notification here
  alert("✅ " + message);
}

// Show error message
function showError(message) {
  // You can implement a toast notification here
  alert("❌ " + message);
}

// Close modals when clicking outside
document.addEventListener("click", (e) => {
  const checkoutModal = document.getElementById("checkoutModal");
  const requestDetailsModal = document.getElementById("requestDetailsModal");

  if (e.target === checkoutModal) {
    closeCheckoutModal();
  }

  if (e.target === requestDetailsModal) {
    closeRequestDetailsModal();
  }
});
