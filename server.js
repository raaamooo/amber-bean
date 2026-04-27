const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const orders = [];

const menuMap = {
  "Espresso": { itemId: "POS_001", price: 3.00, category: "Coffee" },
  "Americano": { itemId: "POS_002", price: 3.50, category: "Coffee" },
  "Cappuccino": { itemId: "POS_003", price: 4.50, category: "Coffee" },
  "Latte": { itemId: "POS_004", price: 4.80, category: "Coffee" },
  "Mocha": { itemId: "POS_005", price: 5.20, category: "Coffee" },
  "Matcha Latte": { itemId: "POS_006", price: 5.30, category: "Tea" },
  "Chai Latte": { itemId: "POS_007", price: 4.90, category: "Tea" },
  "Iced Coffee": { itemId: "POS_008", price: 4.20, category: "Cold Drinks" },
  "Cold Brew": { itemId: "POS_009", price: 4.80, category: "Cold Drinks" },
  "Iced Vanilla Latte": { itemId: "POS_010", price: 5.40, category: "Cold Drinks" },
  "Lemon Iced Tea": { itemId: "POS_011", price: 4.30, category: "Cold Drinks" },
  "Herbal Tea": { itemId: "POS_012", price: 3.80, category: "Tea" },
  "Hot Chocolate": { itemId: "POS_013", price: 4.70, category: "Hot Drinks" },
  "Caramel Frappé": { itemId: "POS_014", price: 5.90, category: "Cold Drinks" }
};

async function sendToCashierSystem(order) {
  console.log("Forwarding to cashier system:", order);

  return {
    success: true,
    cashierQueue: "Front Counter",
    cashierTicketId: "CASH-" + Math.floor(Math.random() * 90000 + 10000)
  };
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/cashier", (req, res) => {
  res.sendFile(path.join(__dirname, "cashier.html"));
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "Amber & Bean Orders API" });
});

app.get("/api/orders", (req, res) => {
  res.json({
    success: true,
    count: orders.length,
    orders
  });
});

app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName,
      drink,
      tableId,
      note,
      source,
      recommendedByQuiz
    } = req.body;

    if (!drink) {
      return res.status(400).json({
        success: false,
        message: "Drink is required."
      });
    }

    const menuItem = menuMap[drink];

    if (!menuItem) {
      return res.status(400).json({
        success: false,
        message: "Invalid drink selected."
      });
    }

    const order = {
      id: "ORD-" + Date.now(),
      customerName: customerName?.trim() || "Guest",
      drink,
      itemId: menuItem.itemId,
      price: menuItem.price,
      category: menuItem.category,
      tableId: tableId?.trim() || "Pickup",
      note: note?.trim() || "",
      source: source || "webapp",
      recommendedByQuiz: Boolean(recommendedByQuiz),
      status: "new",
      createdAt: new Date().toISOString()
    };

    orders.unshift(order);

    const cashierResult = await sendToCashierSystem(order);
    order.cashierTicketId = cashierResult.cashierTicketId;
    order.cashierQueue = cashierResult.cashierQueue;

    return res.json({
      success: true,
      message: "Order sent to cashier successfully.",
      order
    });
  } catch (error) {
    console.error("Order error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error."
    });
  }
});

app.patch("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["new", "preparing", "ready", "served"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status"
    });
  }

  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  order.status = status;

  res.json({
    success: true,
    order
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Amber & Bean server running on http://localhost:${PORT}`);
});