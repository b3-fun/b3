"use client";

import { useState } from "react";
import { OrderDetailsModal } from "./OrderDetailsModal";

export function OrderDetailsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
      >
        <div>
          <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
          <p className="mt-1 text-sm text-gray-500">View the status and details of your orders</p>
        </div>
      </button>
      <OrderDetailsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
