const express = require("express");
const router = express.Router();
const {
  createPayment,
  processPayment,
  getPaymentByOrderId,
  getAllPayments,
} = require("../controllers/payment");

router.get("/", getAllPayments);
router.get("/order/:orderId", getPaymentByOrderId);
router.post("/", createPayment);
router.post("/:paymentId/process", processPayment);

module.exports = router;