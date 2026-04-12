import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const FixedInputTerminal = ({ onSend }: { onSend: (msg: string) => void }) => {
  const [input, setInput] = useState('');

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#000B1E] border-t border-white/10">
      <div className="flex items-center gap-4 max-w-7xl mx-auto">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white font-mono outline-none focus:border-[var(--color-neon-blue)]"
          placeholder="Eingabe für System-Anfrage..."
        />
        <button 
          onClick={() => { onSend(input); setInput(''); }}
          className="p-3 bg-[var(--color-neon-blue)] rounded-lg text-[#000B1E] hover:bg-white transition"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
