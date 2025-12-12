import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

const RSVPForm: React.FC = () => {
  const [name, setName] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await StorageService.addGuest({
        name,
        adults,
        children,
        message
      });
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert(`Ocorreu um erro ao confirmar: ${error.message || 'Erro desconhecido.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl text-center animate-fade-in max-w-md mx-auto mt-10">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-serif-display text-blue-900 mb-2">Presença Confirmada!</h2>
        <p className="text-gray-600">Obrigado, {name}. Estamos ansiosos para celebrar com você!</p>
        <button 
          onClick={() => setIsSuccess(false)}
          className="mt-6 text-pink-600 underline hover:text-pink-800"
        >
          Confirmar outra pessoa
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl mt-4 border-t-4 border-pink-600">
      <h2 className="text-2xl font-serif-display text-center text-blue-900 mb-6">Confirme sua Presença</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
            placeholder="Ex: João da Silva"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adultos</label>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 outline-none"
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n} className="bg-slate-800 text-white">{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crianças</label>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-800 text-white border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 outline-none"
            >
              {[0, 1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n} className="bg-slate-800 text-white">{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem aos Noivos (Opcional)</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md focus:ring-2 focus:ring-pink-500 outline-none resize-none"
            placeholder="Deixe uma mensagem de carinho..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-900 text-white py-3 rounded-md font-bold uppercase tracking-wide hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Confirmar</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default RSVPForm;