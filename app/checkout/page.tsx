'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCatering } from '@/context/CateringContext';
import { formatCurrency } from '@/lib/pricing';
import { getProductById } from '@/lib/products';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface FormData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;

  // Delivery Address
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;

  // Event Details
  eventDate: string;
  deliveryTime: string;

  // Delivery
  deliveryType: 'delivery' | 'pickup';
  deliveryInstructions: string;

  // Additional
  specialInstructions: string;
}

const PROCESS_STEPS = [
  {
    id: 'order',
    label: 'Order',
    description: 'Build your menu',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Delivery info',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'confirmation',
    label: 'Confirm',
    description: 'Review order',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'payment',
    label: 'Payment',
    description: 'Secure checkout',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    id: 'delivery',
    label: 'Delivery',
    description: 'Delivered to your door!',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
];

const DELIVERY_TIMES = [
  '7:00 AM',
  '7:30 AM',
  '8:00 AM',
  '8:30 AM',
  '9:00 AM',
  '9:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '1:00 PM',
  '1:30 PM',
  '2:00 PM',
  '2:30 PM',
  '3:00 PM',
  '3:30 PM',
  '4:00 PM',
  '4:30 PM',
  '5:00 PM',
  '5:30 PM',
  '6:00 PM',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { state, dispatch, calculatedItems, totalCost, isItemInCart } = useCatering();
  const [currentStep, setCurrentStep] = useState(1); // 1 = details, 2 = confirmation
  const [isSubmitting, setIsSubmitting] = useState<'quote' | 'order' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [specialOrderConfirmed, setSpecialOrderConfirmed] = useState(false);
  const hasEventInfo = !!state.eventInfo;

  // Check for special order items in the cart
  const specialOrderItems = state.selectedItems.filter(item => item.product.specialOrder);
  const hasSpecialOrderItems = specialOrderItems.length > 0;
  const buffetSetupProduct = getProductById('buffet-drop-off-setup');
  const setupInCart = isItemInCart('buffet-drop-off-setup');

  const handleToggleSetup = (checked: boolean) => {
    if (!buffetSetupProduct) return;
    if (checked) {
      dispatch({ type: 'ADD_ITEM', payload: buffetSetupProduct });
    } else {
      dispatch({ type: 'REMOVE_ITEM', payload: 'buffet-drop-off-setup' });
    }
  };

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: state.eventInfo?.address || '',
    address2: '',
    city: state.eventInfo?.city || '',
    state: state.eventInfo?.state || '',
    zip: state.eventInfo?.zip || '',
    eventDate: state.eventInfo?.eventDate || '',
    deliveryTime: state.eventInfo?.eventTime || '',
    deliveryType: 'delivery',
    deliveryInstructions: '',
    specialInstructions: state.eventInfo?.specialInstructions || '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Calculate delivery fee based on order subtotal and delivery type
  const getDeliveryFee = (subtotal: number, deliveryType: 'delivery' | 'pickup'): number => {
    if (deliveryType === 'pickup') return 25; // Local Delivery / Pickup
    if (subtotal >= 2000) return 250;          // Delivery over $2k
    if (subtotal >= 1000) return 150;          // Delivery over $1k
    return 100;                                // Standard Delivery Option
  };

  const deliveryFee = getDeliveryFee(totalCost, formData.deliveryType);
  const buffetSetupFee = isItemInCart('buffet-drop-off-setup') ? 50 : 0;
  const SALES_TAX_RATE = 0.1025;
  const salesTax = Math.round((totalCost + buffetSetupFee) * SALES_TAX_RATE * 100) / 100;
  const orderTotal = totalCost + deliveryFee + buffetSetupFee + salesTax;

  // Redirect if cart is empty
  if (calculatedItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5EDE0] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="font-oswald text-2xl font-bold text-[#1A1A1A] mb-2">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your order before checking out.</p>
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.company.trim()) newErrors.company = 'Company/Organization is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zip.trim()) newErrors.zip = 'ZIP code is required';
    if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
    if (!formData.deliveryTime) newErrors.deliveryTime = 'Delivery time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitOrder = async (orderType: 'quote' | 'order') => {
    setIsSubmitting(orderType);
    setSubmitError(null);

    try {
      // Save order details to sessionStorage for confirmation page
      const orderNumber = `SD-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const orderDetails = {
        orderNumber,
        orderType,
        items: calculatedItems.map(item => ({
          title: item.product.title,
          description: item.product.description,
          displayText: item.displayText,
          totalPrice: item.totalPrice,
          servesMin: item.servesMin,
          servesMax: item.servesMax,
        })),
        headcount: state.headcount,
        eventType: state.eventType,
        subtotal: totalCost,
        buffetSetupFee,
        salesTax,
        deliveryType: formData.deliveryType,
        deliveryFee,
        orderTotal,
        perPerson: orderTotal / state.headcount,
        contact: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
        },
        delivery: {
          address: formData.address,
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        },
        event: {
          date: formData.eventDate,
          time: formData.deliveryTime,
          setupRequired: setupInCart,
          specialInstructions: formData.specialInstructions,
        },
        paymentLink: null as string | null,
      };

      // Call the API endpoint
      const response = await fetch('/api/create-catering-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: calculatedItems.map(item => ({
            productId: item.product.id,
            title: item.product.title,
            description: item.product.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            selectedSize: item.selectedSize,
            displayText: item.displayText,
            servesMin: item.servesMin,
            servesMax: item.servesMax,
          })),
          headcount: state.headcount,
          eventType: state.eventType,
          orderType,
          orderNumber,
          buyerInfo: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            eventDate: formData.eventDate,
            eventTime: formData.deliveryTime,
            deliveryAddress: `${formData.address}${formData.address2 ? ', ' + formData.address2 : ''}, ${formData.city}, ${formData.state} ${formData.zip}`,
            notes: formData.specialInstructions,
          },
          delivery: {
            address: formData.address,
            address2: formData.address2,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
          deliveryType: formData.deliveryType,
          setupRequired: setupInCart,
          buffetSetupFee,
          deliveryFee,
          salesTax,
          orderTotal,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit order');
      }

      const result = await response.json();

      // Use server-generated order number if available
      const finalOrderNumber = result.orderNumber || orderNumber;
      orderDetails.orderNumber = finalOrderNumber;
      orderDetails.paymentLink = result.paymentLink || null;

      sessionStorage.setItem('last-order-details', JSON.stringify(orderDetails));

      // Reset the catering state and redirect
      dispatch({ type: 'RESET' });
      router.push('/order-confirmation');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(null);
    }
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-[#F5EDE0]">
      {/* Header */}
      <div className="bg-[#1A1A1A] py-6 sm:py-8">
        <div className="container mx-auto px-4">
          <Link
            href="/#catering"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order
          </Link>
          <h1 className="font-oswald text-3xl sm:text-4xl font-bold text-[#F5EDE0] tracking-wider">
            CHECKOUT
          </h1>
        </div>
      </div>

      {/* Process Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {PROCESS_STEPS.map((step, index) => {
              const isCompleted = index === 0 || (index === 1 && currentStep >= 1);
              const isCurrent = (index === 1 && currentStep === 1) || (index === 2 && currentStep === 2);
              const isFuture = index > (currentStep === 1 ? 1 : 2);

              return (
                <div key={step.id} className="flex flex-col items-center relative">
                  {/* Connector Line */}
                  {index > 0 && (
                    <div
                      className={`absolute right-1/2 top-5 w-full h-0.5 -translate-y-1/2 ${
                        isCompleted || isCurrent ? 'bg-[#E8621A]' : 'bg-gray-200'
                      }`}
                      style={{ width: 'calc(100% + 2rem)', right: '50%', zIndex: 0 }}
                    />
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
                      isCurrent
                        ? 'bg-[#E8621A] text-[#1A1A1A]'
                        : isCompleted
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>

                  {/* Label */}
                  <p
                    className={`mt-2 text-xs sm:text-sm font-oswald font-semibold ${
                      isCurrent ? 'text-[#1A1A1A]' : isCompleted ? 'text-[#1A1A1A]' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {currentStep === 1 ? (
              <div className="space-y-6">
                {/* Contact Information */}
                <Card>
                  <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Contact Information
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company/Organization <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.company ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
                    </div>
                  </div>
                </Card>

                {/* Delivery / Billing Address — always editable */}
                <Card>
                  <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery / Billing Address
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Main Street"
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suite/Floor/Building (Optional)
                      </label>
                      <input
                        type="text"
                        name="address2"
                        value={formData.address2}
                        onChange={handleInputChange}
                        placeholder="Suite 100, Floor 2, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="IL"
                          maxLength={2}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                            errors.state ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="zip"
                          value={formData.zip}
                          onChange={handleInputChange}
                          placeholder="60601"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                            errors.zip ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Instructions
                      </label>
                      <input
                        type="text"
                        name="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={handleInputChange}
                        placeholder="e.g. Dock drop off, use side entrance, call on arrival"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50"
                      />
                    </div>
                  </div>
                </Card>

                {/* Event Details */}
                <Card>
                  <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Event Details
                  </h2>
                  {hasEventInfo && (
                    <p className="text-sm text-gray-500 mb-4">Pre-filled from event planning. Update if needed.</p>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        min={getMinDate()}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.eventDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.eventDate && <p className="text-red-500 text-xs mt-1">{errors.eventDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Time <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="deliveryTime"
                        value={formData.deliveryTime}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 ${
                          errors.deliveryTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select a time...</option>
                        {DELIVERY_TIMES.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                      {errors.deliveryTime && <p className="text-red-500 text-xs mt-1">{errors.deliveryTime}</p>}
                    </div>

                    {/* Delivery Type */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How would you like to receive your order? <span className="text-red-500">*</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.deliveryType === 'delivery'
                              ? 'border-[#E8621A] bg-[#E8621A]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryType"
                            value="delivery"
                            checked={formData.deliveryType === 'delivery'}
                            onChange={handleInputChange}
                            className="text-[#E8621A] focus:ring-[#E8621A]"
                          />
                          <div>
                            <span className="text-sm font-medium text-[#1A1A1A]">Delivery</span>
                            <p className="text-xs text-gray-500">
                              {totalCost >= 2000 ? '$250' : totalCost >= 1000 ? '$150' : '$100'} delivery fee
                            </p>
                          </div>
                        </label>
                        <label
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.deliveryType === 'pickup'
                              ? 'border-[#E8621A] bg-[#E8621A]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryType"
                            value="pickup"
                            checked={formData.deliveryType === 'pickup'}
                            onChange={handleInputChange}
                            className="text-[#E8621A] focus:ring-[#E8621A]"
                          />
                          <div>
                            <span className="text-sm font-medium text-[#1A1A1A]">Local Pickup</span>
                            <p className="text-xs text-gray-500">$25 — 756 E. 111th St, Chicago</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Buffet Drop Off Set Up */}
                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setupInCart}
                          onChange={(e) => handleToggleSetup(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-[#E8621A] focus:ring-[#E8621A]"
                        />
                        <span className="text-sm text-gray-700">
                          <strong>Buffet Drop Off Set Up</strong> — Chafing dishes and sternos set up for your event
                          <span className="text-[#E8621A] font-semibold ml-1">($50)</span>
                        </span>
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Special Instructions / Dietary Notes
                      </label>
                      <textarea
                        name="specialInstructions"
                        value={formData.specialInstructions}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Loading dock access, dietary restrictions, allergies, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E8621A]/50 resize-none"
                      />
                    </div>
                  </div>
                </Card>

                <Button onClick={handleContinue} className="w-full">
                  Continue to Review Order
                </Button>
              </div>
            ) : (
              /* Confirmation Step */
              <div className="space-y-6">
                <Card>
                  <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4">
                    Review Your Order
                  </h2>

                  {/* Contact Summary */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</h3>
                    <p className="text-[#1A1A1A] font-medium">{formData.firstName} {formData.lastName}</p>
                    <p className="text-gray-600 text-sm">{formData.email}</p>
                    <p className="text-gray-600 text-sm">{formData.phone}</p>
                    {formData.company && <p className="text-gray-600 text-sm">{formData.company}</p>}
                  </div>

                  {/* Delivery Summary */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery</h3>
                    <p className="text-[#1A1A1A]">{formData.address}</p>
                    {formData.address2 && <p className="text-[#1A1A1A]">{formData.address2}</p>}
                    <p className="text-[#1A1A1A]">{formData.city}, {formData.state} {formData.zip}</p>
                  </div>

                  {/* Event Summary */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Event</h3>
                    <div className="flex items-center gap-4 text-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(formData.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#E8621A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formData.deliveryTime}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {state.headcount} guests • {formData.deliveryType === 'pickup' ? 'Local Pickup' : 'Delivery'}{setupInCart ? ' • Buffet setup included' : ''}
                    </p>
                    {formData.specialInstructions && (
                      <p className="text-sm text-gray-500 mt-2 italic">"{formData.specialInstructions}"</p>
                    )}
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {calculatedItems.map(item => (
                        <div key={item.product.id} className="flex justify-between text-sm gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-[#1A1A1A]">{item.product.title}</p>
                            <p className="text-gray-400 text-xs line-clamp-2">{item.product.description}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{item.displayText}</p>
                          </div>
                          <p className="font-semibold text-[#1A1A1A] flex-shrink-0">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {submitError && (
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 mb-4">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm">{submitError}</div>
                  </div>
                )}

                {/* Special Order Gate */}
                {hasSpecialOrderItems && !specialOrderConfirmed && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-oswald font-bold text-red-700 text-base mb-1">SPECIAL ORDER ITEMS REQUIRE CONFIRMATION</h3>
                        <p className="text-sm text-red-600 mb-2">
                          The following items are not on our regular menu and require advance preparation:
                        </p>
                        <ul className="text-sm text-red-700 font-medium mb-3 space-y-1">
                          {specialOrderItems.map(item => (
                            <li key={item.product.id}>- {item.product.title}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-red-500 mb-3">
                          Please confirm you understand these items need extra lead time and are subject to availability.
                        </p>
                        <button
                          onClick={() => setSpecialOrderConfirmed(true)}
                          className="bg-red-600 text-white font-oswald font-bold px-6 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          I CONFIRM — PROCEED WITH SPECIAL ORDER
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 text-center mb-4">Take your time. Look it over. Make sure everything is exactly right.</p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    disabled={!!isSubmitting}
                    className="flex-1 px-6 py-3 border-2 border-[#1A1A1A] text-[#1A1A1A] font-oswald font-bold rounded-lg hover:bg-[#1A1A1A] hover:text-white transition-colors disabled:opacity-50"
                  >
                    Edit Details
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={() => handleSubmitOrder('quote')}
                    disabled={!!isSubmitting || (hasSpecialOrderItems && !specialOrderConfirmed)}
                    className="flex-1 px-6 py-3 border-2 border-[#E8621A] text-[#E8621A] font-oswald font-bold rounded-lg hover:bg-[#E8621A]/10 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting === 'quote' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending Quote...
                      </span>
                    ) : (
                      'Request a Quote'
                    )}
                  </button>
                  <Button onClick={() => handleSubmitOrder('order')} className="flex-1" disabled={!!isSubmitting || (hasSpecialOrderItems && !specialOrderConfirmed)}>
                    {isSubmitting === 'order' ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Placing Order...
                      </span>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 bg-[#F5EDE0]">
              <h2 className="font-oswald text-xl font-bold text-[#1A1A1A] mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({calculatedItems.length} item{calculatedItems.length !== 1 ? 's' : ''})</span>
                  <span className="font-medium text-[#1A1A1A]">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Guests</span>
                  <span className="font-medium text-[#1A1A1A]">{state.headcount}</span>
                </div>
                {buffetSetupFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Buffet Setup</span>
                    <span className="font-medium text-[#1A1A1A]">{formatCurrency(buffetSetupFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sales Tax (10.25%)</span>
                  <span className="font-medium text-[#1A1A1A]">{formatCurrency(salesTax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formData.deliveryType === 'pickup' ? 'Local Pickup' : 'Delivery'}
                  </span>
                  <span className="font-medium text-[#1A1A1A]">{formatCurrency(deliveryFee)}</span>
                </div>
              </div>

              <div className="flex justify-between font-oswald font-bold text-lg mb-2">
                <span className="text-[#1A1A1A]">Total</span>
                <span className="text-[#E8621A]">{formatCurrency(orderTotal)}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-500">
                <span>Per Person</span>
                <span>{formatCurrency(orderTotal / state.headcount)}</span>
              </div>

              {/* Items Preview */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {calculatedItems.map(item => (
                    <div key={item.product.id} className="text-sm flex justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[#1A1A1A] font-medium">{item.product.title}</p>
                        <p className="text-gray-400 text-xs line-clamp-1">{item.product.description}</p>
                        <p className="text-gray-500 text-xs">{item.displayText}</p>
                      </div>
                      <p className="text-[#1A1A1A] font-semibold flex-shrink-0">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  On-time delivery guaranteed
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full setup included
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Satisfaction guaranteed
                </div>
              </div>

              {/* Support */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Need Help?</p>
                <a href="tel:3126008155" className="text-sm text-[#E8621A] hover:text-[#1A1A1A] transition-colors font-semibold">
                  (312) 600-8155
                </a>
                <p className="text-xs text-gray-400 mt-1">Call, email, or text us anytime</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
