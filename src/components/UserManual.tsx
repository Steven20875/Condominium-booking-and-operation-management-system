import React, { useMemo, useState } from 'react';
import { BookOpen, Sparkles, ShieldCheck, Users, CreditCard, Wrench, MessageCircleMore, ArrowRight } from 'lucide-react';
import { Modal, ModalBody } from './ui';

interface UserManualProps {
  isOpen: boolean;
  onClose: () => void;
}

type SectionId = 'getting-started' | 'resident-guide' | 'admin-guide' | 'faq' | 'troubleshooting' | 'support';

const sectionDetails: Array<{
  id: SectionId;
  title: string;
  description: string;
  icon: typeof BookOpen;
  items: Array<{ title: string; body: string }>;
}> = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn how to enter the system, sign in, and move around the portal with confidence.',
    icon: BookOpen,
    items: [
      {
        title: 'Access the platform',
        body: 'Open the application from the landing page and choose the Sign In option to enter the resident or admin area.'
      },
      {
        title: 'Create or use an account',
        body: 'Residents can register a new account or sign in using the email/password option or Google sign-in if configured.'
      },
      {
        title: 'Understand the main navigation',
        body: 'Use the dashboard tabs and side menu to move between overview, bookings, payments, maintenance, and notifications.'
      }
    ]
  },
  {
    id: 'resident-guide',
    title: 'Resident / User Guide',
    description: 'Follow the step-by-step flow for booking, payments, notifications, and support requests.',
    icon: Users,
    items: [
      {
        title: 'View available units',
        body: 'Go to the Browse tab to review available condominium units, prices, amenities, and current availability.'
      },
      {
        title: 'Make a reservation',
        body: 'Select a unit, choose your check-in and check-out dates, confirm the guest count, and submit the booking request.'
      },
      {
        title: 'Check booking details and status',
        body: 'Visit the Bookings tab to view pending, approved, or completed reservations and their current status.'
      },
      {
        title: 'Review payments',
        body: 'Open the Payments section to inspect outstanding balances, payment history, and invoice-related updates.'
      },
      {
        title: 'Use the dashboard and help tools',
        body: 'The resident dashboard also provides notifications, support actions, and the built-in help/chat options for quick assistance.'
      }
    ]
  },
  {
    id: 'admin-guide',
    title: 'Admin Guide',
    description: 'Use the operations dashboard to manage residents, bookings, payments, maintenance, and announcements.',
    icon: ShieldCheck,
    items: [
      {
        title: 'Open the admin dashboard',
        body: 'Sign in using the administrator account to access the operations hub and control panels.'
      },
      {
        title: 'Manage residents and bookings',
        body: 'Use the Resident Directory and Reservation Approvals sections to review accounts and approve or track bookings.'
      },
      {
        title: 'Monitor payments and reports',
        body: 'The Cash Ledger and audit sections help admins review invoices, payment status, and reporting details.'
      },
      {
        title: 'Handle maintenance requests',
        body: 'The Repairs Claims Desk provides a central place for reviewing maintenance issues and updating progress.'
      },
      {
        title: 'Send broadcast messages',
        body: 'Admins can also post building-wide notices to inform residents about updates, warnings, or important announcements.'
      }
    ]
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Common questions about bookings, payments, and account access are answered here.',
    icon: Sparkles,
    items: [
      {
        title: 'How do I book a unit?',
        body: 'Browse the available units, choose one, and submit the reservation details from the booking form.'
      },
      {
        title: 'What if my payment is pending?',
        body: 'Check the Payments tab for the latest invoice or payment status and confirm the details before re-submitting.'
      },
      {
        title: 'How do I fix login issues?',
        body: 'Double-check the email and password, use the password recovery option, or try the Google sign-in method if available.'
      },
      {
        title: 'Can I contact support?',
        body: 'Yes. Use the help/chat support tools or the contact details shown in the application.'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Quick steps for common problems with sign-in, bookings, payments, and general use.',
    icon: Wrench,
    items: [
      {
        title: 'Login problems',
        body: 'If sign-in fails, verify your credentials, use the recovery option, or try again after refreshing the page.'
      },
      {
        title: 'Booking problems',
        body: 'If a booking does not appear, confirm the unit is still available and review the booking status in the Bookings tab.'
      },
      {
        title: 'Payment issues',
        body: 'If a payment is not updating, check the invoice status and confirm that the payment details were entered correctly.'
      },
      {
        title: 'General issues',
        body: 'Refresh the page, confirm your internet connection, and use the support/chat tools for additional help.'
      }
    ]
  },
  {
    id: 'support',
    title: 'Contact / Support',
    description: 'Use the built-in support channels when you need additional help from the team.',
    icon: MessageCircleMore,
    items: [
      {
        title: 'Use the chatbot',
        body: 'The floating support assistant can answer common questions about bookings, payments, and maintenance.'
      },
      {
        title: 'Use the help tools',
        body: 'Residents and admins can open this manual anytime from the menus to review instructions and common solutions.'
      },
      {
        title: 'Contact the property team',
        body: 'If you need direct assistance, use the contact info shown on the public landing page or within the support features.'
      }
    ]
  }
];

export default function UserManual({ isOpen, onClose }: UserManualProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('getting-started');

  const activeContent = useMemo(() => {
    return sectionDetails.find(section => section.id === activeSection) || sectionDetails[0];
  }, [activeSection]);

  const Icon = activeContent.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" className="bg-slate-950 text-white border border-white/10">
      <ModalBody className="p-0">
        <div className="grid lg:grid-cols-[250px_minmax(0,1fr)] min-h-[70vh]">
          <div className="bg-slate-900/90 border-b lg:border-b-0 lg:border-r border-white/10 p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-300 border border-blue-500/20">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold">Support Hub</p>
                <h3 className="font-serif font-black text-white text-lg">User Manual</h3>
              </div>
            </div>

            <div className="space-y-2">
              {sectionDetails.map((section) => {
                const SectionIcon = section.icon;
                const isActive = section.id === activeSection;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-blue-500/30 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <SectionIcon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-semibold">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto">
            <div className="flex items-center gap-2 text-blue-300 text-[10px] font-semibold uppercase tracking-[0.3em]">
              <Sparkles className="h-3.5 w-3.5" />
              One Spatial Iloilo Help Center
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="p-2 rounded-xl bg-white/10 text-blue-300">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xl font-serif font-black text-white">{activeContent.title}</h4>
                <p className="text-sm text-slate-400 mt-1">{activeContent.description}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {activeContent.items.map((item, index) => (
                <div key={`${activeContent.id}-${index}`} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-blue-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-sm text-slate-300 mt-1">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              <div className="flex items-center gap-2 font-semibold">
                <ArrowRight className="h-4 w-4" />
                Need more help?
              </div>
              <p className="mt-2 text-emerald-100/90">
                Use the support chatbot or contact the property team through the existing contact options in the application.
              </p>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
