import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Copy, Check, ChefHat } from 'lucide-react';
import type { Order, OrderItem } from '../../orders/api/ordersApi';

export type ThermalPaperSize = '80mm' | '58mm';

interface KitchenTicketPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  restaurantName?: string;
  branchName?: string;
}

export const KitchenTicketPrintModal: React.FC<KitchenTicketPrintModalProps> = ({
  isOpen,
  onClose,
  order,
  restaurantName = 'InstaDine Restaurant',
  branchName = 'Main Kitchen',
}) => {
  const [paperSize, setPaperSize] = useState<ThermalPaperSize>(() => {
    return (localStorage.getItem('iqr_kot_paper_size') as ThermalPaperSize) || '80mm';
  });
  const [isCopied, setIsCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePaperSizeChange = (size: ThermalPaperSize) => {
    setPaperSize(size);
    localStorage.setItem('iqr_kot_paper_size', size);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate plain ASCII ESC/POS text for direct thermal printer apps
  const generateRawEscPosText = () => {
    const divider = paperSize === '58mm' ? '--------------------------------' : '==========================================';
    const lines = [
      '*** KITCHEN ORDER TICKET (KOT) ***',
      restaurantName.toUpperCase(),
      branchName,
      divider,
      `ORDER NO: #${order.orderNumber}`,
      `TYPE    : ${order.orderType === 'DINE_IN' ? `DINE-IN (TABLE ${order.tableNumber || '-'})` : 'TAKEAWAY'}`,
      `TIME    : ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      `CUSTOMER: ${order.customerName || 'Guest'}`,
      divider,
      'QTY  ITEM',
      divider,
    ];

    (order.items || []).forEach((item: OrderItem) => {
      lines.push(`[${item.quantity}x] ${item.productName}`);
      if (item.notes) {
        lines.push(`     >> NOTE: ${item.notes}`);
      }
    });

    if (order.orderNotes) {
      lines.push(divider);
      lines.push(`SPECIAL INSTRUCTIONS:\n${order.orderNotes}`);
    }

    lines.push(divider);
    lines.push(`PREP TARGET: ${order.prepTimeMinutes || 15} MINS`);
    lines.push('*** COOK FRESH & SPEEDY ***\n\n\n');

    return lines.join('\n');
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(generateRawEscPosText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const modalContent = (
    <>
      {/* Dynamic Thermal Print Styles for Kitchen Ticket */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #kitchen-thermal-ticket,
          #kitchen-thermal-ticket * {
            visibility: visible !important;
          }
          #kitchen-thermal-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${paperSize === '58mm' ? '58mm' : '80mm'} !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${paperSize === '58mm' ? '58mm auto' : '80mm auto'};
            margin: 0mm;
          }
        }
      `}</style>

      {/* Screen Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in my-auto">
          {/* Header Bar */}
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-surface-2/60">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-bold text-sm text-text">
                  Kitchen Ticket (KOT)
                </h3>
                <p className="text-[11px] text-muted">
                  Order #{order.orderNumber} • Thermal Print
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Paper Size Selector */}
              <div className="flex items-center rounded-lg border border-border p-0.5 bg-surface text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('80mm')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    paperSize === '80mm'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  80mm
                </button>
                <button
                  type="button"
                  onClick={() => handlePaperSizeChange('58mm')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    paperSize === '58mm'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  58mm
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-muted hover:text-text transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Receipt Preview */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-zinc-100 dark:bg-zinc-950/60 flex justify-center">
            {/* The Actual Printable Thermal Paper Component */}
            <div
              id="kitchen-thermal-ticket"
              className="bg-white text-black font-mono p-5 shadow-md border border-zinc-300 rounded-sm text-left select-text"
              style={{
                width: paperSize === '58mm' ? '240px' : '310px',
                fontSize: paperSize === '58mm' ? '11px' : '12px',
                lineHeight: 1.35,
              }}
            >
              {/* Ticket Top Header */}
              <div className="text-center pb-2 border-b-2 border-dashed border-black">
                <p className="text-xs font-black tracking-widest uppercase">
                  *** KITCHEN ORDER TICKET ***
                </p>
                <p className="font-extrabold text-sm uppercase mt-0.5">{restaurantName}</p>
                <p className="text-[10px] text-zinc-700">{branchName}</p>
              </div>

              {/* Order Meta */}
              <div className="py-2.5 border-b-2 border-dashed border-black space-y-1 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="font-black text-xl">#{order.orderNumber}</span>
                  <span className="font-bold text-[11px] px-1.5 py-0.5 border border-black uppercase">
                    {order.orderType === 'DINE_IN'
                      ? `TABLE ${order.tableNumber || '-'}`
                      : 'TAKEAWAY'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>Target: {order.prepTimeMinutes || 15}m</span>
                </div>
                {order.customerName && (
                  <p className="text-[11px] truncate">Diner: {order.customerName}</p>
                )}
              </div>

              {/* Items Breakdown */}
              <div className="py-3 border-b-2 border-dashed border-black">
                <div className="flex justify-between font-bold text-[11px] uppercase pb-1 mb-1 border-b border-zinc-400">
                  <span>QTY  ITEM</span>
                </div>

                <div className="space-y-2">
                  {(order.items || []).map((item: OrderItem) => (
                    <div key={item.id} className="text-xs">
                      <div className="flex items-start gap-2">
                        <span className="font-black text-sm bg-black text-white px-1 py-0.2 rounded-xs shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-sm leading-tight">
                          {item.productName}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-[11px] font-semibold pl-7 text-zinc-800 italic mt-0.5">
                          &gt;&gt; NOTE: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Special Instructions */}
              {order.orderNotes && (
                <div className="py-2 border-b-2 border-dashed border-black text-xs">
                  <p className="font-black uppercase text-[10px]">Cooking Instructions:</p>
                  <p className="font-bold italic mt-0.5 text-zinc-900 bg-zinc-100 p-1">
                    "{order.orderNotes}"
                  </p>
                </div>
              )}

              {/* Ticket Footer */}
              <div className="pt-3 text-center text-[10px] space-y-1">
                <p className="font-bold tracking-wider">
                  TOTAL DISHES: {(order.items || []).reduce((s: number, i: OrderItem) => s + i.quantity, 0)}
                </p>
                <p className="tracking-widest">============================</p>
                <p className="font-black uppercase tracking-wider">
                  *** COOK FRESH &amp; SPEEDY ***
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-5 py-3.5 border-t border-border bg-surface flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopyRaw}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
              title="Copy plain ESC/POS formatted ticket for Bluetooth print apps"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ESC/POS</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print KOT ({paperSize})</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};
