'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/pricing';

interface OrderDetails {
  orderNumber: string;
  orderType?: 'quote' | 'order';
  items: Array<{
    title: string;
    description?: string;
    displayText: string;
    totalPrice: number;
  }>;
  headcount: number;
  eventType: string;
  subtotal: number;
  deliveryFee: number;
  orderTotal: number;
  perPerson: number;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
  };
  delivery: {
    address: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
  };
  event: {
    date: string;
    time: string;
    setupRequired: boolean;
    specialInstructions: string;
  };
  paymentLink?: string | null;
}

const TIMELINE_STEPS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Order Received',
    description: 'Your order has been confirmed',
    status: 'complete' as const,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Confirmation Email Sent',
    description: 'Check your inbox for order details',
    status: 'complete' as const,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: '24 Hours Before',
    description: "We'll call to confirm final details",
    status: 'upcoming' as const,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: '30 Minutes Before',
    description: 'Your driver will text when on the way',
    status: 'upcoming' as const,
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: 'Delivery & Setup',
    description: 'Setup and presentation by our team',
    status: 'upcoming' as const,
  },
];

export default function OrderConfirmationPage() {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('last-order-details');
      if (stored) {
        setOrderDetails(JSON.parse(stored));
      }
    } catch {
      // Ignore errors
    }
  }, []);

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-[#F5EDE0] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="font-oswald text-2xl font-bold text-[#1A1A1A] mb-2">No Order Found</h2>
          <p className="text-gray-600 mb-6">It looks like you haven&apos;t placed an order yet.</p>
          <Link
            href="/#catering"
            className="inline-block bg-[#1A1A1A] text-white font-oswald font-bold px-6 py-3 rounded-lg hover:bg-[#E8621A] hover:text-[#1A1A1A] transition-colors"
          >
            Start Ordering
          </Link>
        </Card>
      </div>
    );
  }

  const isQuote = orderDetails.orderType === 'quote';

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Brand colors
    const orange: [number, number, number] = [232, 98, 26];
    const dark: [number, number, number] = [56, 56, 56];
    const gray: [number, number, number] = [128, 128, 128];

    // Header bar
    doc.setFillColor(...dark);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setFontSize(22);
    doc.setTextColor(250, 250, 250);
    doc.setFont('helvetica', 'bold');
    doc.text('LEXINGTON BETTY SMOKEHOUSE', margin, 15);
    doc.setFontSize(10);
    doc.setTextColor(...orange);
    doc.text(`${isQuote ? 'Quote' : 'Order'} #${orderDetails.orderNumber}`, margin, 25);
    doc.setTextColor(200, 200, 200);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, 25, { align: 'right' });

    y = 45;

    // Document title
    doc.setFontSize(16);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.text(isQuote ? 'CATERING QUOTE' : 'CATERING ORDER RECEIPT', margin, y);
    y += 12;

    // Order items
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, contentWidth, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', margin + 2, y);
    doc.text('DETAILS', margin + 80, y);
    doc.text('AMOUNT', pageWidth - margin - 2, y, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...dark);
    orderDetails.items.forEach((item) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(item.title, margin + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text(item.displayText, margin + 80, y);
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(formatCurrency(item.totalPrice), pageWidth - margin - 2, y, { align: 'right' });
      y += 8;
    });

    // Divider
    y += 2;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Totals
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.text('Subtotal', margin + 2, y);
    doc.setTextColor(...dark);
    doc.text(formatCurrency(orderDetails.subtotal), pageWidth - margin - 2, y, { align: 'right' });
    y += 7;

    doc.setTextColor(...gray);
    doc.text('Delivery', margin + 2, y);
    doc.setTextColor(...dark);
    doc.text(formatCurrency(orderDetails.deliveryFee), pageWidth - margin - 2, y, { align: 'right' });
    y += 7;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin + 100, y - 3, pageWidth - margin, y - 3);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...dark);
    doc.text('Total', margin + 2, y + 4);
    doc.setTextColor(...orange);
    doc.text(formatCurrency(orderDetails.orderTotal), pageWidth - margin - 2, y + 4, { align: 'right' });
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text(`Per Person (${orderDetails.headcount} guests): ${formatCurrency(orderDetails.perPerson)}`, margin + 2, y + 2);
    y += 16;

    // Delivery Details section
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFillColor(...dark);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFontSize(10);
    doc.setTextColor(250, 250, 250);
    doc.setFont('helvetica', 'bold');
    doc.text('DELIVERY DETAILS', margin + 4, y + 6);
    y += 16;

    // Contact
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTACT', margin + 2, y);
    doc.text('DELIVERY ADDRESS', pageWidth / 2 + 5, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(`${orderDetails.contact.firstName} ${orderDetails.contact.lastName}`, margin + 2, y);
    doc.text(orderDetails.delivery.address, pageWidth / 2 + 5, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(orderDetails.contact.email, margin + 2, y);
    if (orderDetails.delivery.address2) {
      doc.text(orderDetails.delivery.address2, pageWidth / 2 + 5, y);
    }
    y += 5;
    doc.text(orderDetails.contact.phone, margin + 2, y);
    doc.text(`${orderDetails.delivery.city}, ${orderDetails.delivery.state} ${orderDetails.delivery.zip}`, pageWidth / 2 + 5, y);
    y += 5;
    if (orderDetails.contact.company) {
      doc.text(orderDetails.contact.company, margin + 2, y);
      y += 5;
    }
    y += 8;

    // Date & Details
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE & TIME', margin + 2, y);
    doc.text('DETAILS', pageWidth / 2 + 5, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    if (orderDetails.event.date) {
      doc.text(new Date(orderDetails.event.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }), margin + 2, y);
    }
    doc.text(`${orderDetails.headcount} guests`, pageWidth / 2 + 5, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(orderDetails.event.time || '', margin + 2, y);
    doc.text(orderDetails.event.setupRequired ? 'Full setup included' : 'Drop-off only', pageWidth / 2 + 5, y);
    y += 12;

    // Footer
    doc.setDrawColor(...orange);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Lexington Betty Smokehouse  |  (312) 600-8155  |  orders@souldelivered.com', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('Thank you for choosing Lexington Betty Smokehouse!', pageWidth / 2, y, { align: 'center' });

    // Save
    const filename = `LexBetty-${isQuote ? 'Quote' : 'Order'}-${orderDetails.orderNumber}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Success Hero */}
      <div className="bg-[#1A1A1A] py-12 sm:py-16 text-center">
        <div className="animate-scale-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 text-white mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-oswald text-3xl sm:text-4xl md:text-5xl font-bold text-[#F5EDE0] tracking-wider mb-3">
            {isQuote ? 'YOUR QUOTE IS READY!' : 'YOU DID IT — THE FOOD IS PLANNED!'}
          </h1>
          <p className="text-[#E8621A] text-lg sm:text-xl font-oswald font-bold">
            {isQuote ? 'Quote' : 'Order'} #{orderDetails.orderNumber}
          </p>
        </div>
      </div>

      {/* Payment Link / Guarantee Banner */}
      {orderDetails.paymentLink ? (
        <div className="bg-[#E8621A] py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="font-oswald font-bold text-[#1A1A1A] text-sm sm:text-base tracking-wide mb-3">
              YOUR INVOICE IS READY — PAY SECURELY ONLINE
            </p>
            <a
              href={orderDetails.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#1A1A1A] text-white font-oswald font-bold px-8 py-3 rounded-lg hover:bg-[#4a4747] transition-colors text-lg"
            >
              Pay Now
            </a>
            <p className="text-[#1A1A1A]/70 text-xs mt-2">
              A payment link has also been sent to {orderDetails.contact.email}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[#E8621A] py-3">
          <div className="container mx-auto px-4 text-center">
            <p className="font-oswald font-bold text-[#1A1A1A] text-sm sm:text-base tracking-wide">
              {isQuote
                ? "WE'LL REVIEW YOUR QUOTE AND GET BACK TO YOU WITHIN 1 BUSINESS DAY."
                : "NOW YOU CAN FOCUS ON THE FUN PART — WE'VE GOT THE FOOD HANDLED."}
            </p>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <div className="grid gap-6">
          {/* Warm Paragraph */}
          <p className="text-center text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            {orderDetails.paymentLink
              ? 'Your invoice has been created and a payment link sent to your email. Pay online anytime before your event.'
              : isQuote
              ? "We've sent a copy of this quote to your email. Our team will reach out to finalize details and confirm your event. This quote is valid for 7 days."
              : "Our team will reach out to confirm payment and delivery details. All that's left for you is to enjoy the event."}
          </p>

          {/* Order Summary Card */}
          <Card>
            <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order Summary
            </h2>
            <div className="space-y-3 mb-4">
              {orderDetails.items.map((item, i) => {
                const descLines = item.description?.split('\n') || [];
                return (
                  <div key={i} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex justify-between text-sm gap-3">
                      <p className="font-oswald font-bold text-[#1A1A1A]">{item.title}</p>
                      <p className="font-oswald font-bold text-[#1A1A1A] flex-shrink-0">{formatCurrency(item.totalPrice)}</p>
                    </div>
                    {descLines.length > 0 && (
                      <div className="mt-1">
                        {descLines.map((line, j) => (
                          <p key={j} className={`text-xs ${j === 0 ? 'text-[#E8621A] font-semibold' : 'text-gray-500'}`}>
                            {j > 0 && '• '}{line}
                          </p>
                        ))}
                      </div>
                    )}
                    {!item.description && item.displayText && (
                      <p className="text-gray-500 text-xs mt-0.5">{item.displayText}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(orderDetails.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium">{formatCurrency(orderDetails.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-oswald font-bold text-lg pt-2 border-t border-gray-200">
                <span className="text-[#1A1A1A]">Total</span>
                <span className="text-[#E8621A]">{formatCurrency(orderDetails.orderTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Per Person ({orderDetails.headcount} guests)</span>
                <span>{formatCurrency(orderDetails.perPerson)}</span>
              </div>
            </div>
          </Card>

          {/* Delivery Details Card */}
          <Card>
            <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                <p className="text-[#1A1A1A] font-medium">{orderDetails.contact.firstName} {orderDetails.contact.lastName}</p>
                <p className="text-sm text-gray-600">{orderDetails.contact.email}</p>
                <p className="text-sm text-gray-600">{orderDetails.contact.phone}</p>
                {orderDetails.contact.company && (
                  <p className="text-sm text-gray-600">{orderDetails.contact.company}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Delivery Address</p>
                <p className="text-[#1A1A1A]">{orderDetails.delivery.address}</p>
                {orderDetails.delivery.address2 && <p className="text-[#1A1A1A]">{orderDetails.delivery.address2}</p>}
                <p className="text-[#1A1A1A]">{orderDetails.delivery.city}, {orderDetails.delivery.state} {orderDetails.delivery.zip}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date & Time</p>
                <p className="text-[#1A1A1A] font-medium">
                  {orderDetails.event.date && new Date(orderDetails.event.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-gray-600">{orderDetails.event.time}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Details</p>
                <p className="text-sm text-[#1A1A1A]">{orderDetails.headcount} guests</p>
                <p className="text-sm text-[#1A1A1A]">{orderDetails.event.setupRequired ? 'Full setup included' : 'Drop-off only'}</p>
                {orderDetails.event.specialInstructions && (
                  <p className="text-sm text-gray-500 italic mt-1">&ldquo;{orderDetails.event.specialInstructions}&rdquo;</p>
                )}
              </div>
            </div>
          </Card>

          {/* What Happens Next Timeline */}
          <Card>
            <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Here&apos;s What We&apos;ll Take Care Of
            </h2>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, index) => (
                <div key={index} className="flex gap-4">
                  {/* Timeline Line & Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      step.status === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    {index < TIMELINE_STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 ${
                        step.status === 'complete' ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="pb-6">
                    <p className={`font-oswald font-bold text-sm ${
                      step.status === 'complete' ? 'text-[#1A1A1A]' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Support Section */}
          <Card className="bg-[#1A1A1A] text-white border-none">
            <h2 className="font-oswald text-xl font-bold text-[#F5EDE0] mb-3">
              Need to Make Changes?
            </h2>
            <p className="text-white/70 text-sm mb-4">
              We&apos;re here to help. Modify your order up to 24 hours before delivery.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <a href="tel:3126008155" className="flex items-center gap-2 text-[#E8621A] hover:text-white transition-colors text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                (312) 600-8155
              </a>
              <a href="mailto:orders@souldelivered.com" className="flex items-center gap-2 text-[#E8621A] hover:text-white transition-colors text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us
              </a>
              <a href="sms:3126008155" className="flex items-center gap-2 text-[#E8621A] hover:text-white transition-colors text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Text Us
              </a>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#catering">
              <Button className="w-full sm:w-auto px-8">
                Start New Order
              </Button>
            </Link>
            <Button variant="outline" onClick={handleDownloadPDF} className="w-full sm:w-auto px-8">
              Download Receipt
            </Button>
            <a href="tel:3126008155">
              <Button variant="secondary" className="w-full sm:w-auto px-8">
                Contact Us
              </Button>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
