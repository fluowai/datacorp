import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: any) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulação de autenticação (Será substituído por Firebase)
    setTimeout(() => {
      if (email && password) {
        onLogin({ email, name: name || email.split('@')[0] });
      } else {
        setError("Por favor, preencha todos os campos.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
        <div className="p-8 lg:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 mb-6">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              {mode === 'login' && 'Bem-vindo de volta'}
              {mode === 'register' && 'Crie sua conta'}
              {mode === 'recovery' && 'Recuperar senha'}
            </h1>
            <p className="text-slate-500 font-medium text-sm">
              {mode === 'login' && 'Acesse sua central de inteligência B2B.'}
              {mode === 'register' && 'Comece a minerar leads qualificados hoje.'}
              {mode === 'recovery' && 'Enviaremos um link para o seu e-mail.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Nome Completo"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                placeholder="E-mail profissional"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'recovery' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  placeholder="Sua senha"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-indigo-600 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setMode('recovery')}
                  className="text-xs font-black text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' && 'ENTRAR NA PLATAFORMA'}
                  {mode === 'register' && 'CRIAR MINHA CONTA'}
                  {mode === 'recovery' && 'ENVIAR LINK DE RECUPERAÇÃO'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'login' ? (
                <>Não tem uma conta? <button onClick={() => setMode('register')} className="text-indigo-600 font-black hover:underline">Cadastre-se</button></>
              ) : (
                <>Já possui uma conta? <button onClick={() => setMode('login')} className="text-indigo-600 font-black hover:underline">Fazer Login</button></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
