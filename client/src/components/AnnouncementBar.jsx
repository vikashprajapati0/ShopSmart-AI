import React, { useState } from 'react';
import { Sparkles, X, Tag } from 'lucide-react';

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white text-xs sm:text-sm font-medium py-2 px-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1 flex items-center justify-center gap-2 text-center">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            Festive Sale is Live! Use code <strong className="underline tracking-wide">WELCOME10</strong> for 10% off • Free delivery on orders over ₹999
          </span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="text-white/80 hover:text-white transition ml-3"
          aria-label="Close Announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
