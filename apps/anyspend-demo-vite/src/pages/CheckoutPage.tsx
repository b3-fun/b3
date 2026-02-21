import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { AnySpendCheckout, type CheckoutItem, type CheckoutSummaryLine } from "@b3dotfun/sdk/anyspend/react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { parseUnits, formatUnits } from "viem";

const DEMO_RECIPIENT = "0xD32b34E2E55c7005b6506370857bdE4cFD057fC4";

/* ------------------------------------------------------------------ */
/* Default demo data                                                   */
/* ------------------------------------------------------------------ */

const DEFAULT_ITEMS: CheckoutItem[] = [
  {
    id: "item-1",
    name: "B3kemon Starter Pack",
    description: "3 random B3kemon creatures to start your journey",
    imageUrl: "https://cdn.b3.fun/b3kemon-card.png",
    amount: parseUnits("100", 18).toString(),
    quantity: 1,
    metadata: { Rarity: "Common", Edition: "2025" },
  },
  {
    id: "item-2",
    name: "Rare Pokeball",
    description: "Increases catch rate by 2x",
    amount: parseUnits("50", 18).toString(),
    quantity: 2,
    metadata: { Type: "Consumable" },
  },
];

/* ------------------------------------------------------------------ */
/* Helper: convert human-readable token amount to wei string           */
/* ------------------------------------------------------------------ */
function toWei(value: string): string {
  try {
    const num = Number.parseFloat(value);
    if (Number.isNaN(num) || num < 0) return "0";
    return parseUnits(value, 18).toString();
  } catch {
    return "0";
  }
}

function fromWei(value: string): string {
  try {
    return formatUnits(BigInt(value), 18);
  } catch {
    return "0";
  }
}

/* ------------------------------------------------------------------ */
/* Editable state types                                                */
/* ------------------------------------------------------------------ */
interface EditableItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  amount: string; // human-readable (e.g. "100")
  quantity: number;
  metadata: Record<string, string>;
}

interface Adjustments {
  shippingEnabled: boolean;
  shippingAmount: string;
  shippingLabel: string;
  taxEnabled: boolean;
  taxAmount: string;
  taxLabel: string;
  taxRate: string;
  discountEnabled: boolean;
  discountAmount: string;
  discountLabel: string;
  discountCode: string;
  summaryLines: { label: string; amount: string; description: string }[];
}

function itemToEditable(item: CheckoutItem): EditableItem {
  return {
    id: item.id || crypto.randomUUID(),
    name: item.name,
    description: item.description || "",
    imageUrl: item.imageUrl || "",
    amount: fromWei(item.amount),
    quantity: item.quantity,
    metadata: item.metadata || {},
  };
}

function editableToItem(e: EditableItem): CheckoutItem {
  return {
    id: e.id,
    name: e.name,
    description: e.description || undefined,
    imageUrl: e.imageUrl || undefined,
    amount: toWei(e.amount),
    quantity: e.quantity,
    metadata: Object.keys(e.metadata).length > 0 ? e.metadata : undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Cart Editor Modal                                                   */
/* ------------------------------------------------------------------ */

function CartEditorModal({
  items,
  adjustments,
  onSave,
  onClose,
}: {
  items: EditableItem[];
  adjustments: Adjustments;
  onSave: (items: EditableItem[], adjustments: Adjustments) => void;
  onClose: () => void;
}) {
  const [editItems, setEditItems] = useState<EditableItem[]>(items);
  const [adj, setAdj] = useState<Adjustments>(adjustments);

  const updateItem = useCallback((index: number, patch: Partial<EditableItem>) => {
    setEditItems(prev => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }, []);

  const removeItem = useCallback((index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addItem = useCallback(() => {
    setEditItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "New Item",
        description: "",
        imageUrl: "",
        amount: "10",
        quantity: 1,
        metadata: {},
      },
    ]);
  }, []);

  const addMetadata = useCallback((itemIndex: number) => {
    setEditItems(prev =>
      prev.map((item, i) =>
        i === itemIndex ? { ...item, metadata: { ...item.metadata, "": "" } } : item,
      ),
    );
  }, []);

  const updateMetadata = useCallback(
    (itemIndex: number, oldKey: string, newKey: string, value: string) => {
      setEditItems(prev =>
        prev.map((item, i) => {
          if (i !== itemIndex) return item;
          const meta = { ...item.metadata };
          if (oldKey !== newKey) delete meta[oldKey];
          meta[newKey] = value;
          return { ...item, metadata: meta };
        }),
      );
    },
    [],
  );

  const removeMetadata = useCallback((itemIndex: number, key: string) => {
    setEditItems(prev =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const meta = { ...item.metadata };
        delete meta[key];
        return { ...item, metadata: meta };
      }),
    );
  }, []);

  const addSummaryLine = useCallback(() => {
    setAdj(prev => ({
      ...prev,
      summaryLines: [...prev.summaryLines, { label: "Fee", amount: "1", description: "" }],
    }));
  }, []);

  const removeSummaryLine = useCallback((index: number) => {
    setAdj(prev => ({
      ...prev,
      summaryLines: prev.summaryLines.filter((_, i) => i !== index),
    }));
  }, []);

  const updateSummaryLine = useCallback(
    (index: number, patch: Partial<{ label: string; amount: string; description: string }>) => {
      setAdj(prev => ({
        ...prev,
        summaryLines: prev.summaryLines.map((line, i) => (i === index ? { ...line, ...patch } : line)),
      }));
    },
    [],
  );

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
  const labelClass = "text-xs font-medium text-gray-500 dark:text-gray-400";
  const sectionClass = "rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12 pb-12">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Cart & Order Summary</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {/* LINE ITEMS */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
              >
                <Plus className="h-3 w-3" /> Add Item
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {editItems.map((item, index) => (
                <div key={item.id} className={sectionClass}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Item #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input className={inputClass} value={item.name} onChange={e => updateItem(index, { name: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Image URL</label>
                      <input className={inputClass} value={item.imageUrl} onChange={e => updateItem(index, { imageUrl: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Description</label>
                      <input className={inputClass} value={item.description} onChange={e => updateItem(index, { description: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Amount (tokens)</label>
                      <input className={inputClass} type="number" min="0" step="0.01" value={item.amount} onChange={e => updateItem(index, { amount: e.target.value })} />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input className={inputClass} type="number" min="1" value={item.quantity} onChange={e => updateItem(index, { quantity: Math.max(1, Number.parseInt(e.target.value) || 1) })} />
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Metadata</label>
                      <button
                        type="button"
                        onClick={() => addMetadata(index)}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        + Add
                      </button>
                    </div>
                    {Object.entries(item.metadata).map(([key, value], metaIdx) => (
                      <div key={metaIdx} className="mt-1 flex items-center gap-1.5">
                        <input
                          className={`${inputClass} !w-28`}
                          placeholder="Key"
                          value={key}
                          onChange={e => updateMetadata(index, key, e.target.value, value)}
                        />
                        <span className="text-gray-400">:</span>
                        <input
                          className={inputClass}
                          placeholder="Value"
                          value={value}
                          onChange={e => updateMetadata(index, key, key, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeMetadata(index, key)}
                          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ADJUSTMENTS */}
          <div className="mb-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Order Adjustments</h3>

            <div className="flex flex-col gap-3">
              {/* Shipping */}
              <div className={sectionClass}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adj.shippingEnabled}
                    onChange={e => setAdj(prev => ({ ...prev, shippingEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping</span>
                </label>
                {adj.shippingEnabled && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Amount (tokens)</label>
                      <input className={inputClass} type="number" min="0" step="0.01" value={adj.shippingAmount} onChange={e => setAdj(prev => ({ ...prev, shippingAmount: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Label (optional)</label>
                      <input className={inputClass} value={adj.shippingLabel} onChange={e => setAdj(prev => ({ ...prev, shippingLabel: e.target.value }))} placeholder="Shipping" />
                    </div>
                  </div>
                )}
              </div>

              {/* Tax */}
              <div className={sectionClass}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adj.taxEnabled}
                    onChange={e => setAdj(prev => ({ ...prev, taxEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tax</span>
                </label>
                {adj.taxEnabled && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Amount (tokens)</label>
                      <input className={inputClass} type="number" min="0" step="0.01" value={adj.taxAmount} onChange={e => setAdj(prev => ({ ...prev, taxAmount: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Label (optional)</label>
                      <input className={inputClass} value={adj.taxLabel} onChange={e => setAdj(prev => ({ ...prev, taxLabel: e.target.value }))} placeholder="Tax" />
                    </div>
                    <div>
                      <label className={labelClass}>Rate (optional)</label>
                      <input className={inputClass} value={adj.taxRate} onChange={e => setAdj(prev => ({ ...prev, taxRate: e.target.value }))} placeholder="8%" />
                    </div>
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className={sectionClass}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={adj.discountEnabled}
                    onChange={e => setAdj(prev => ({ ...prev, discountEnabled: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount</span>
                </label>
                {adj.discountEnabled && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className={labelClass}>Amount (tokens)</label>
                      <input className={inputClass} type="number" min="0" step="0.01" value={adj.discountAmount} onChange={e => setAdj(prev => ({ ...prev, discountAmount: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelClass}>Label (optional)</label>
                      <input className={inputClass} value={adj.discountLabel} onChange={e => setAdj(prev => ({ ...prev, discountLabel: e.target.value }))} placeholder="Discount" />
                    </div>
                    <div>
                      <label className={labelClass}>Code (optional)</label>
                      <input className={inputClass} value={adj.discountCode} onChange={e => setAdj(prev => ({ ...prev, discountCode: e.target.value }))} placeholder="SAVE10" />
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Lines */}
              <div className={sectionClass}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Custom Summary Lines</span>
                  <button
                    type="button"
                    onClick={addSummaryLine}
                    className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <Plus className="h-3 w-3" /> Add
                  </button>
                </div>
                {adj.summaryLines.map((line, idx) => (
                  <div key={idx} className="mt-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className={labelClass}>Label</label>
                      <input className={inputClass} value={line.label} onChange={e => updateSummaryLine(idx, { label: e.target.value })} />
                    </div>
                    <div className="w-24">
                      <label className={labelClass}>Amount</label>
                      <input className={inputClass} type="number" step="0.01" value={line.amount} onChange={e => updateSummaryLine(idx, { amount: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Note</label>
                      <input className={inputClass} value={line.description} onChange={e => updateSummaryLine(idx, { description: e.target.value })} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSummaryLine(idx)}
                      className="mb-0.5 shrink-0 rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(editItems, adj)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function CheckoutPage() {
  const [items, setItems] = useState<EditableItem[]>(DEFAULT_ITEMS.map(itemToEditable));
  const [adjustments, setAdjustments] = useState<Adjustments>({
    shippingEnabled: false,
    shippingAmount: "5",
    shippingLabel: "",
    taxEnabled: false,
    taxAmount: "16",
    taxLabel: "",
    taxRate: "8%",
    discountEnabled: false,
    discountAmount: "10",
    discountLabel: "",
    discountCode: "SAVE10",
    summaryLines: [],
  });
  const [editorOpen, setEditorOpen] = useState(false);

  const handleSave = useCallback((newItems: EditableItem[], newAdj: Adjustments) => {
    setItems(newItems);
    setAdjustments(newAdj);
    setEditorOpen(false);
  }, []);

  // Convert to checkout props
  const checkoutItems: CheckoutItem[] = items.map(editableToItem);

  const shipping = adjustments.shippingEnabled
    ? { amount: toWei(adjustments.shippingAmount), label: adjustments.shippingLabel || undefined }
    : undefined;

  const tax = adjustments.taxEnabled
    ? { amount: toWei(adjustments.taxAmount), label: adjustments.taxLabel || undefined, rate: adjustments.taxRate || undefined }
    : undefined;

  const discount = adjustments.discountEnabled
    ? { amount: toWei(adjustments.discountAmount), label: adjustments.discountLabel || undefined, code: adjustments.discountCode || undefined }
    : undefined;

  const summaryLines: CheckoutSummaryLine[] | undefined =
    adjustments.summaryLines.length > 0
      ? adjustments.summaryLines.map(l => ({
          label: l.label,
          amount: toWei(l.amount),
          description: l.description || undefined,
        }))
      : undefined;

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 pt-8">
      {/* Edit Cart button */}
      <div className="mx-auto mb-4 flex max-w-4xl justify-end">
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Pencil className="h-4 w-4" />
          Edit Cart
        </button>
      </div>

      <AnySpendCheckout
        mode="page"
        recipientAddress={DEMO_RECIPIENT}
        destinationTokenAddress={B3_TOKEN.address}
        destinationTokenChainId={B3_TOKEN.chainId}
        items={checkoutItems}
        senderAddress="0x1216de6853e2c2cAEd6F5B0C2791D2E4a765D954"
        organizationName="B3kemon Shop"
        organizationLogo="https://cdn.b3.fun/b3kemon-card.png"
        buttonText="Pay Now"
        shipping={shipping}
        tax={tax}
        discount={discount}
        summaryLines={summaryLines}
        onSuccess={result => {
          console.log("Payment success:", result);
        }}
        onError={error => {
          console.error("Payment error:", error);
        }}
        returnUrl="/"
        returnLabel="Back to Home"
      />

      {editorOpen && (
        <CartEditorModal
          items={items}
          adjustments={adjustments}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
