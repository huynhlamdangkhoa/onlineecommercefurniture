"use client";

import { use, useEffect, useState } from "react";

type OrderItem = {
  id?: string;
  productId?: string;
  productTitle?: string;
  price: number;
  quantity: number;
  subtotal?: number;
};

type Order = {
  id: string;
  orderNumber?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  total?: number;
  shippingRecipientName?: string;
  shippingPhone?: string;
  shippingLine1?: string;
  shippingLine2?: string | null;
  shippingCity?: string;
  shippingCountry?: string;
  items?: OrderItem[];
};

type Payment = {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  transactionId?: string | null;
  paidAt?: string | null;
};

export default function OrderPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(true);

  const bankInfo = {
    bankName: "Techcombank",
    accountNumber: "3094200409",
    accountHolder: "Nguyen Phuoc Thinh",
    transferContent: `Chuyển tiền mua ....`,
  };

  const fetchOrder = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${id}`);

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setOrder(data);
    } catch (error) {
      console.error("Fetch order error:", error);
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchPayment = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/payments/order/${id}`);

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setPayment(data);
    } catch (error) {
      console.error("Fetch payment error:", error);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchPayment();
  }, [id]);

  const createPayment = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch("http://localhost:3001/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: id,
          method: order?.paymentMethod || "BANK_TRANSFER",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to create payment");
        return;
      }

      setPayment(data);
      setMessage("Payment created successfully.");
    } catch (error) {
      console.error("Create payment error:", error);
      setMessage("Something went wrong while creating payment.");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async (result: "PAID" | "FAILED") => {
    if (!payment?.id) return;

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        `http://localhost:3001/api/payments/${payment.id}/process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ result }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Payment processing failed");
        return;
      }

      if (data.payment) {
        setPayment(data.payment);
      }

      await fetchOrder();

      setMessage(
        result === "PAID"
          ? "Payment completed successfully."
          : "Payment failed."
      );
    } catch (error) {
      console.error("Process payment error:", error);
      setMessage("Something went wrong while processing payment.");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusStyle = (status?: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-700 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getOrderStatusStyle = (status?: string) => {
    switch (status) {
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const showBankInfo =
    payment?.method === "BANK_TRANSFER" ||
    order?.paymentMethod === "BANK_TRANSFER" ||
    !payment;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
            <p className="mt-2 text-sm text-gray-500">
              Complete payment for your order and review the transaction status.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="mt-1 break-all font-semibold text-gray-900">{id}</p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {order?.orderNumber || "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {payment?.method || order?.paymentMethod || "BANK_TRANSFER"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {payment
                    ? `$${payment.amount}`
                    : order?.total != null
                    ? `$${order.total}`
                    : "N/A"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Payment Status</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getPaymentStatusStyle(
                      payment?.status || order?.paymentStatus
                    )}`}
                  >
                    {payment?.status || order?.paymentStatus || "NOT CREATED"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Order Status</p>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getOrderStatusStyle(
                      order?.status
                    )}`}
                  >
                    {order?.status || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {showBankInfo && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Bank Transfer Information
                </p>

                <div className="mt-3 space-y-2 text-sm text-gray-800">
                  <p>
                    <span className="font-medium">Bank Name:</span>{" "}
                    {bankInfo.bankName}
                  </p>
                  <p>
                    <span className="font-medium">Account Number:</span>{" "}
                    {bankInfo.accountNumber}
                  </p>
                  <p>
                    <span className="font-medium">Account Holder:</span>{" "}
                    {bankInfo.accountHolder}
                  </p>
                  <p>
                    <span className="font-medium">Transfer Content:</span>{" "}
                    {bankInfo.transferContent}
                  </p>
                </div>

                <p className="mt-3 text-xs text-green-700">
                  Please use the exact transfer content so the system can match
                  your payment.
                </p>
              </div>
            )}

            {payment?.transactionId && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {payment.transactionId}
                </p>
              </div>
            )}

            {payment?.paidAt && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Paid At</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(payment.paidAt).toLocaleString()}
                </p>
              </div>
            )}

            {order && (
              <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Shipping Information</p>
                <div className="mt-2 space-y-1 text-sm text-gray-800">
                  <p>{order.shippingRecipientName || "Customer"}</p>
                  <p>{order.shippingPhone || "N/A"}</p>
                  <p>{order.shippingLine1 || "N/A"}</p>
                  {order.shippingLine2 && <p>{order.shippingLine2}</p>}
                  <p>
                    {order.shippingCity || ""} {order.shippingCountry || ""}
                  </p>
                </div>
              </div>
            )}

            {message && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
                {message}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {!payment && (
                <button
                  onClick={createPayment}
                  disabled={loading}
                  className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? "Creating..." : "Create Payment"}
                </button>
              )}

              {payment?.status === "PENDING" && (
                <>
                  <button
                    onClick={() => processPayment("PAID")}
                    disabled={loading}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {loading ? "Processing..." : "Pay Now"}
                  </button>

                  <button
                    onClick={() => processPayment("FAILED")}
                    disabled={loading}
                    className="rounded-lg border border-red-200 bg-white px-5 py-2.5 font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    Simulate Failure
                  </button>
                </>
              )}

              {payment?.status === "FAILED" && (
                <button
                  onClick={() => processPayment("PAID")}
                  disabled={loading}
                  className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {loading ? "Processing..." : "Retry Payment"}
                </button>
              )}

              {payment?.status === "PAID" && (
                <button
                  disabled
                  className="cursor-not-allowed rounded-lg bg-gray-300 px-5 py-2.5 font-medium text-gray-700"
                >
                  Payment Completed
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
            <p className="mt-2 text-sm text-gray-500">
              Review your order details before completing payment.
            </p>

            {orderLoading ? (
              <div className="mt-8 text-sm text-gray-500">Loading order...</div>
            ) : !order ? (
              <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Order details could not be loaded. Check whether your backend has
                an endpoint like <code>/api/orders/:id</code>.
              </div>
            ) : (
              <>
                <div className="mt-8 space-y-4">
                  {(order.items || []).length > 0 ? (
                    order.items?.map((item, index) => (
                      <div
                        key={item.id || `${item.productId}-${index}`}
                        className="flex items-start justify-between border-b border-gray-100 pb-4"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.productTitle || "Product"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            $
                            {item.subtotal != null
                              ? item.subtotal
                              : item.price * item.quantity}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${item.price} each
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No item details available from the order API yet.
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${order.subtotal ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span>${order.shippingFee ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Discount</span>
                    <span>${order.discount ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${order.total ?? 0}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}