/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, MessageSquare, Phone, Send, ShieldCheck, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FoodDonation } from '../../types';

interface ContactDonorModalProps {
  donation: FoodDonation | null;
  onClose: () => void;
}

export const ContactDonorModal: React.FC<ContactDonorModalProps> = ({
  donation,
  onClose,
}) => {
  if (!donation) return null;

  const [messageSent, setMessageSent] = useState(false);
  const [customNote, setCustomNote] = useState(
    `Hello ${donation.donorName}! I saw your "${donation.title}" on F.E.A.S.T. and would like to arrange pickup within your window (${donation.pickupWindow}).`
  );

  const cleanPhone = donation.donorPhone.replace(/[^0-9]/g, '');
  const encodedNote = encodeURIComponent(customNote);

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedNote}`;
  const telUrl = `tel:${cleanPhone}`;
  const smsUrl = `sms:${cleanPhone}?body=${encodedNote}`;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#181b22] border border-[#2a303c] shadow-2xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262b36]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee59d]">
              F.E.A.S.T. Direct Connection
            </span>
            <h2 id="contact-modal-title" className="text-lg font-bold text-white font-heading">
              Contact Food Donor
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-[#262b36] transition-colors"
            aria-label="Close contact modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Food Info snippet */}
        <div className="p-3 rounded-xl bg-[#121418] border border-[#262b36] flex items-center gap-3">
          {donation.imageUrl ? (
            <img
              src={donation.imageUrl}
              alt=""
              className="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#222733] flex items-center justify-center text-[#2ee59d] shrink-0 font-bold">
              {donation.title.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 text-xs">
            <h3 className="font-bold text-white truncate">{donation.title}</h3>
            <p className="text-neutral-400 truncate">
              {donation.quantity} • Serves ~{donation.estimatedServings}
            </p>
            <p className="text-[#2ee59d] text-[11px] font-medium mt-0.5 truncate">
              Pickup Area: {donation.locality}
            </p>
          </div>
        </div>

        {/* Privacy & Safety Notice */}
        <div className="p-3 rounded-xl bg-[#161a22] border border-[#222836] text-[11px] text-neutral-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#2ee59d] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Donor Privacy & Coordination</p>
            <p className="text-neutral-400 mt-0.5 leading-relaxed">
              Exact residential address and pickup instructions are coordinated directly with the donor to respect community privacy. Contacting the donor does not automatically reserve or remove the food.
            </p>
          </div>
        </div>

        {/* Message preview */}
        <div className="flex flex-col gap-1.5 text-xs">
          <label htmlFor="intro-message" className="text-neutral-300 font-medium">
            Introduction & Pickup Request
          </label>
          <textarea
            id="intro-message"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            rows={3}
            className="w-full p-2.5 rounded-xl bg-[#121418] border border-[#272b35] text-white text-xs focus:outline-none focus:border-[#2ee59d] transition-colors"
          />
        </div>

        {/* Direct Contact Options */}
        <div className="flex flex-col gap-2 pt-1">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Choose Preferred Channel
          </p>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMessageSent(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs flex items-center justify-between transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Connect via WhatsApp</span>
            </div>
            <span className="text-[11px] opacity-80">{donation.donorPhone}</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            {/* Phone Call */}
            <a
              href={telUrl}
              onClick={() => setMessageSent(true)}
              className="py-2.5 px-3 rounded-xl bg-[#222733] hover:bg-[#2a303f] text-neutral-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#2f3545]"
            >
              <Phone className="w-4 h-4 text-[#2ee59d]" />
              <span>Direct Phone</span>
            </a>

            {/* SMS */}
            <a
              href={smsUrl}
              onClick={() => setMessageSent(true)}
              className="py-2.5 px-3 rounded-xl bg-[#222733] hover:bg-[#2a303f] text-neutral-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-[#2f3545]"
            >
              <Send className="w-4 h-4 text-[#2ee59d]" />
              <span>Send SMS</span>
            </a>
          </div>
        </div>

        {/* Confirmation Note */}
        {messageSent && (
          <div className="p-3 rounded-xl bg-[#12281e] border border-[#2ee59d]/40 text-xs text-[#2ee59d] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Contact channel opened! Remember to bring clean storage containers.</span>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs text-neutral-400 hover:text-white transition-colors"
        >
          Return to Feed
        </button>
      </div>
    </div>
  );
};
