"use client";

import { use, useState } from "react";

type Payment = {
  id: string;
  orderId: string;
  method: string;
  status: string;
  amount: number;
  transactionId?: string | null;
  paidAt?: string | null;
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [message, setMessage] = useState("");

  const createPayment = async () => {
    const res = await fetch("http://localhost:3001/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: id,
        method: "COD",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Create payment failed");
      return;
    }

    setPayment(data);
    setMessage("Payment created successfully");
  };

  const paySuccess = async () => {
    if (!payment?.id) return;

    const res = await fetch(
      `http://localhost:3001/api/payments/${payment.id}/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result: "PAID",
        }),
      }
    );

    const data = await res.json();
    setMessage(data.message || "Payment success");

    if (data.payment) {
      setPayment(data.payment);
    }
  };

  const payFailed = async () => {
    if (!payment?.id) return;

    const res = await fetch(
      `http://localhost:3001/api/payments/${payment.id}/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result: "FAILED",
        }),
      }
    );

    const data = await res.json();
    setMessage(data.message || "Payment failed");

    if (data.payment) {
      setPayment(data.payment);
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Order ID: {id}</h1>

      <div className="mb-4 flex gap-3">
        <button
          onClick={createPayment}
          className="rounded bg-green-600 px-4 py-2 text-white"
        >
          Create Payment
        </button>

        <button
          onClick={paySuccess}
          className="rounded bg-blue-600 px-4 py-2 text-white"
          disabled={!payment}
        >
          Pay Success
        </button>

        <button
          onClick={payFailed}
          className="rounded bg-red-600 px-4 py-2 text-white"
          disabled={!payment}
        >
          Pay Failed
        </button>
      </div>

      <p className="mb-4">{message}</p>

      {payment && (
        <div className="rounded border p-4">
          <p><strong>Payment ID:</strong> {payment.id}</p>
          <p><strong>Method:</strong> {payment.method}</p>
          <p><strong>Status:</strong> {payment.status}</p>
          <p><strong>Amount:</strong> {payment.amount}</p>
          <p><strong>Transaction ID:</strong> {payment.transactionId || "N/A"}</p>
          <p><strong>Paid At:</strong> {payment.paidAt || "N/A"}</p>
        </div>
      )}
    </div>
  );
}