import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Receipt, FileText } from 'lucide-react';
import type { PlacedOrder } from '../../api/ordersApi';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export type ThermalPaperSize = '80mm' | '58mm';

interface CustomerReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PlacedOrder | null;
  currencySymbol: string;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  currencySymbol,
}) => {
  useBodyScrollLock(isOpen);
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top on open
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  // Paper size is automatically determined by the restaurant's configured printer width
  const serverWidth = order.restaurant?.themeConfig?.receiptWidth;
  const paperSize: ThermalPaperSize =
    serverWidth === '58mm'
      ? '58mm'
      : serverWidth === '80mm'
      ? '80mm'
      : typeof window !== 'undefined' &&
        localStorage.getItem('instant_qr_thermal_printer_size') === '58mm'
      ? '58mm'
      : '80mm';

  const formatPrice = (amount: number | string | null | undefined): string => {
    const val = Number(amount || 0);
    return `${currencySymbol}${val.toFixed(2)}`;
  };

  const handlePrint = () => {
    // Inject dynamic print style for exact page size (58mm or 80mm) matching restaurant setting
    const styleId = 'customer-thermal-receipt-dynamic-page-size';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `
      @media print {
        @page {
          size: ${paperSize === '58mm' ? '58mm' : '80mm'} auto;
          margin: 0mm;
        }
      }
    `;

    window.print();
  };

  const restaurantName = order.restaurant?.name || order.branch?.name || 'Restaurant';
  const branchName = order.branch?.name || '';
  const branchAddress = order.branch?.address || '';
  const branchPhone = order.branch?.phone || '';

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isDineIn = order.orderType === 'DINE_IN';
  const isPaid = order.paymentStatus === 'PAID';

  return (
    <>
      {/* =========================================================================
          SCREEN MODAL: High-fidelity thermal paper preview matching restaurant POS
          ========================================================================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--sf-primary, #ea580c)' }}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                  Customer Digital Receipt
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                  Order #{order.orderNumber} &bull; {order.customerName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Receipt Preview Canvas (Auto width from restaurant settings) */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-900/10 dark:bg-black/40 flex justify-center items-start"
          >
            {/* Realistic Thermal Paper Container in Restaurant Width */}
            <div
              className={`bg-white text-black font-mono transition-all duration-200 shadow-2xl border border-neutral-300 rounded-xs p-3.5 sm:p-4 my-2 shrink-0 ${
                paperSize === '80mm' ? 'w-[330px]' : 'w-[260px]'
              }`}
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                lineHeight: '1.25',
              }}
            >
              <ThermalReceiptBody
                order={order}
                restaurantName={restaurantName}
                branchName={branchName}
                branchAddress={branchAddress}
                branchPhone={branchPhone}
                formattedDate={formattedDate}
                formattedTime={formattedTime}
                isDineIn={isDineIn}
                isPaid={isPaid}
                paperSize={paperSize}
                formatPrice={formatPrice}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Official Storefront Receipt
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                style={{ backgroundColor: 'var(--sf-primary, #ea580c)' }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          PRINT PORTAL: Rendered directly on document.body for clean @media print
          ========================================================================= */}
      {createPortal(
        <div
          id="customer-receipt-portal"
          className="hidden print:block text-black bg-white"
          style={{
            width: paperSize === '58mm' ? '54mm' : '76mm',
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          <ThermalReceiptBody
            order={order}
            restaurantName={restaurantName}
            branchName={branchName}
            branchAddress={branchAddress}
            branchPhone={branchPhone}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            isDineIn={isDineIn}
            isPaid={isPaid}
            paperSize={paperSize}
            formatPrice={formatPrice}
          />
        </div>,
        document.body,
      )}
    </>
  );
};

// =============================================================================
// Reusable Thermal Receipt Layout Body (Identical to POS Layout)
// =============================================================================
interface ThermalReceiptBodyProps {
  order: PlacedOrder;
  restaurantName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  formattedDate: string;
  formattedTime: string;
  isDineIn: boolean;
  isPaid: boolean;
  paperSize: ThermalPaperSize;
  formatPrice: (amount: number | string | null | undefined) => string;
}

const ThermalReceiptBody: React.FC<ThermalReceiptBodyProps> = ({
  order,
  restaurantName,
  branchName,
  branchAddress,
  branchPhone,
  formattedDate,
  formattedTime,
  isDineIn,
  isPaid,
  paperSize,
  formatPrice,
}) => {
  const is58 = paperSize === '58mm';
  const divider = is58
    ? '----------------------------'
    : '----------------------------------------';
  const doubleDivider = is58
    ? '============================'
    : '========================================';

  return (
    <div
      className={`text-black text-[12px] leading-tight select-text ${
        is58 ? 'text-[11px]' : 'text-[12px]'
      }`}
    >
      {/* Header */}
      <div className="text-center space-y-0.5">
        <h2 className="text-sm sm:text-base font-black tracking-tight uppercase">
          {restaurantName}
        </h2>
        {branchName && (
          <div className="text-[11px] font-semibold">{branchName}</div>
        )}
        {branchAddress && (
          <div className="text-[10px] text-neutral-800 break-words">
            {branchAddress}
          </div>
        )}
        {branchPhone && (
          <div className="text-[10px] font-bold">Ph: {branchPhone}</div>
        )}
      </div>

      <div className="text-center font-bold my-1 text-[11px] overflow-hidden whitespace-nowrap">
        {doubleDivider}
      </div>

      {/* Order Meta */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-base font-black">
            ORDER #{order.orderNumber}
          </span>
          <span className="font-bold text-[11px] uppercase">
            {isDineIn ? `TABLE ${order.tableNumber || '-'}` : 'TAKEAWAY'}
          </span>
        </div>

        <div className="flex justify-between text-[10px] text-neutral-800">
          <span>Date: {formattedDate}</span>
          <span>{formattedTime}</span>
        </div>

        <div className="flex justify-between text-[11px] pt-0.5">
          <span className="font-bold">{order.customerName}</span>
          {order.customerPhone && (
            <span className="text-neutral-800">{order.customerPhone}</span>
          )}
        </div>
      </div>

      <div className="text-center font-bold my-1 text-[11px] overflow-hidden whitespace-nowrap">
        {divider}
      </div>

      {/* Items Table */}
      <div className="space-y-1.5">
        {/* Table Headings */}
        {is58 ? (
          <div className="grid grid-cols-12 gap-0.5 font-bold text-[9.5px] uppercase border-b border-black pb-0.5">
            <span className="col-span-4">ITEM</span>
            <span className="col-span-2 text-center">QTY</span>
            <span className="col-span-3 text-right">PRICE</span>
            <span className="col-span-3 text-right">TOTAL</span>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-1 font-bold text-[11px] uppercase border-b border-black pb-0.5">
            <span className="col-span-5">ITEM</span>
            <span className="col-span-2 text-center">QTY</span>
            <span className="col-span-2 text-right">PRICE</span>
            <span className="col-span-3 text-right">TOTAL</span>
          </div>
        )}

        {/* Item Rows */}
        {order.items.map((item) => {
          const unitPrice =
            item.unitPrice ||
            (item.quantity > 0 ? Number(item.totalPrice) / item.quantity : 0);

          return (
            <div key={item.id} className="space-y-0.5">
              {is58 ? (
                <div className="grid grid-cols-12 gap-0.5 items-baseline text-[10px]">
                  <span className="col-span-4 font-bold break-words leading-tight">
                    {item.productName}
                  </span>
                  <span className="col-span-2 text-center font-bold">
                    {item.quantity}
                  </span>
                  <span className="col-span-3 text-right text-neutral-700">
                    {formatPrice(unitPrice)}
                  </span>
                  <span className="col-span-3 text-right font-black">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-1 items-baseline text-[11px]">
                  <span className="col-span-5 font-bold break-words leading-tight">
                    {item.productName}
                  </span>
                  <span className="col-span-2 text-center font-bold">
                    {item.quantity}
                  </span>
                  <span className="col-span-2 text-right text-neutral-700">
                    {formatPrice(unitPrice)}
                  </span>
                  <span className="col-span-3 text-right font-black">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              )}

              {/* Item Specific Notes */}
              {item.notes && (
                <div className="text-[10px] italic pl-2 text-neutral-700">
                  &bull; Note: "{item.notes}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Customer Special Note Box */}
      {order.orderNotes && (
        <div className="my-2 p-1.5 border border-dashed border-black rounded-xs text-[10px]">
          <div className="font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
            <FileText className="w-2.5 h-2.5" />
            <span>Customer Instruction:</span>
          </div>
          <div className="font-bold italic mt-0.5">"{order.orderNotes}"</div>
        </div>
      )}

      <div className="text-center font-bold my-1 text-[11px] overflow-hidden whitespace-nowrap">
        {divider}
      </div>

      {/* Bill Totals */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Items Subtotal:</span>
          <span className="font-bold">{formatPrice(order.subtotal)}</span>
        </div>

        {Number(order.tax) > 0 && (
          <div className="flex justify-between">
            <span>Tax (GST):</span>
            <span className="font-bold">{formatPrice(order.tax)}</span>
          </div>
        )}

        <div className="text-center font-bold my-0.5 text-[11px] overflow-hidden whitespace-nowrap">
          {doubleDivider}
        </div>

        <div className="flex justify-between items-baseline text-sm font-black pt-0.5">
          <span>TOTAL BILL:</span>
          <span className="text-base tracking-tight">
            {formatPrice(order.totalAmount)}
          </span>
        </div>

        <div className="flex justify-between text-[11px] pt-1">
          <span>Payment Method:</span>
          <span className="font-bold uppercase">
            {order.paymentMethod || 'CASH'}
          </span>
        </div>

        <div className="flex justify-between text-[11px]">
          <span>Payment Status:</span>
          <span className={`font-black uppercase ${isPaid ? 'underline' : ''}`}>
            {isPaid ? 'PAID' : 'PENDING'}
          </span>
        </div>
      </div>

      <div className="text-center font-bold my-1 text-[11px] overflow-hidden whitespace-nowrap">
        {doubleDivider}
      </div>

      {/* Footer Notes */}
      <div className="text-center space-y-0.5 pt-1 pb-4 text-[10px] text-neutral-800">
        <div className="font-bold">Thank you for dining with us!</div>
        <div>Please visit again</div>
        <div className="text-[9px] text-neutral-600 pt-1">
          Instant QR Storefront &bull; Table #{order.tableNumber || '-'}
        </div>
      </div>
    </div>
  );
};
