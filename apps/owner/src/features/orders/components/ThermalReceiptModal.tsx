import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Receipt, Check, FileText } from 'lucide-react';
import type { Order } from '../api/ordersApi';
import type { Restaurant, Branch } from '@instant-qr/shared-types';
import { useCurrencyStore } from '../../../store/useCurrencyStore';

export type ThermalPaperSize = '80mm' | '58mm';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  restaurant?: Restaurant | null;
  branch?: Branch | null;
}

const STORAGE_KEY = 'instant_qr_thermal_printer_size';

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  restaurant,
  branch,
}) => {
  const { formatPrice } = useCurrencyStore();

  const [paperSize, setPaperSize] = useState<ThermalPaperSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === '58mm' ? '58mm' : '80mm';
  });

  const handleSelectSize = (size: ThermalPaperSize) => {
    setPaperSize(size);
    localStorage.setItem(STORAGE_KEY, size);
  };

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

  // Reset scroll to top on open or size toggle so the header is never scrolled out of view
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, paperSize, order]);

  const handlePrint = () => {
    // Inject dynamic print style for exact page size
    const styleId = 'thermal-receipt-dynamic-page-size';
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

  if (!isOpen || !order) return null;

  // Resolve display restaurant & branch info
  const restaurantName = restaurant?.name || order.branch?.name || 'Restaurant';
  const branchName = branch?.name || order.branch?.name || '';
  const branchAddress = branch?.address || '';
  const branchPhone = branch?.phone || '';

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
          SCREEN MODAL: High-fidelity thermal paper preview with size toggle
          ========================================================================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-2/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text leading-tight">
                  Print Thermal Receipt
                </h3>
                <p className="text-xs text-muted font-medium mt-0.5">
                  Order #{order.orderNumber} &bull; {order.customerName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Size Selector Toolbar */}
          <div className="px-5 py-3 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-semibold text-muted">
              Thermal Paper Width:
            </div>

            <div className="inline-flex p-1 rounded-xl bg-surface-2 border border-border">
              <button
                type="button"
                onClick={() => handleSelectSize('80mm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  paperSize === '80mm'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
              >
                {paperSize === '80mm' && <Check className="w-3.5 h-3.5" />}
                <span>80mm (Standard POS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectSize('58mm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  paperSize === '58mm'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-muted hover:text-text'
                }`}
              >
                {paperSize === '58mm' && <Check className="w-3.5 h-3.5" />}
                <span>58mm (Compact)</span>
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Preview Canvas */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-900/10 dark:bg-black/40 flex justify-center items-start"
          >
            {/* Realistic Thermal Paper Container */}
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
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-surface">
            <span className="text-xs text-muted">
              Auto-saved for next prints
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt ({paperSize})</span>
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
          id="thermal-receipt-portal"
          className="text-black bg-white"
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
        document.body
      )}
    </>
  );
};

// =============================================================================
// Reusable Thermal Receipt Layout Body
// =============================================================================
interface ThermalReceiptBodyProps {
  order: Order;
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
  const divider = is58 ? '----------------------------' : '----------------------------------------';
  const doubleDivider = is58 ? '============================' : '========================================';

  return (
    <div className={`text-black text-[12px] leading-tight select-text ${is58 ? 'text-[11px]' : 'text-[12px]'}`}>
      {/* Header */}
      <div className="text-center space-y-0.5">
        <h2 className="text-sm sm:text-base font-black tracking-tight uppercase">
          {restaurantName}
        </h2>
        {branchName && (
          <div className="text-[11px] font-semibold">{branchName}</div>
        )}
        {branchAddress && (
          <div className="text-[10px] text-neutral-800 break-words">{branchAddress}</div>
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
        {order.items.map((item) => (
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
                  {formatPrice(item.unitPrice)}
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
                  {formatPrice(item.unitPrice)}
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
        ))}
      </div>

      {/* Customer Special Note Box */}
      {order.orderNotes && (
        <div className="my-2 p-1.5 border border-dashed border-black rounded-xs text-[10px]">
          <div className="font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
            <FileText className="w-2.5 h-2.5" />
            <span>Customer Instruction:</span>
          </div>
          <div className="font-bold italic mt-0.5">
            "{order.orderNotes}"
          </div>
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
          <span className="text-base tracking-tight">{formatPrice(order.totalAmount)}</span>
        </div>

        <div className="flex justify-between text-[11px] pt-1">
          <span>Payment Method:</span>
          <span className="font-bold uppercase">{order.paymentMethod || 'CASH'}</span>
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
          Instant QR Storefront &bull; Table #{order.tableNumber || '1'}
        </div>
      </div>
    </div>
  );
};

