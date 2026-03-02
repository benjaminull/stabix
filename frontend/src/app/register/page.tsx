'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react';
import { useRegister } from '@/lib/api/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/brand/Logo';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.username || !formData.password) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.password !== formData.password_confirm) {
      toast.error('Las contrasenas no coinciden');
      return;
    }

    try {
      await registerMutation.mutateAsync(formData);
      toast.success('Cuenta creada exitosamente! Por favor inicia sesion.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D213B] via-[#162840] to-[#1a2f47] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-[#FF8C42]/20 bg-[#1a2f47]/80 backdrop-blur-sm shadow-[0_0_40px_rgba(255,140,66,0.15)]">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Logo size={60} showText={false} />
            </div>
            <CardTitle className="text-3xl font-display font-bold">
              <span className="bg-gradient-to-r from-[#FF8C42] to-[#FFD166] bg-clip-text text-transparent">
                Crear Cuenta
              </span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Unete a nuestra comunidad de profesionales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Correo electronico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-200">
                  Nombre de usuario *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="usuario123"
                    className="w-full pl-10 pr-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium text-gray-200">
                    Nombre
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Juan"
                    className="w-full px-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium text-gray-200">
                    Apellido
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Perez"
                    className="w-full px-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-200">
                  Telefono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                    className="w-full pl-10 pr-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Contrasena *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password_confirm" className="text-sm font-medium text-gray-200">
                  Confirmar contrasena *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password_confirm"
                    name="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-[#0D213B]/50 border border-[#FF8C42]/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF8C42]/50 focus:border-transparent transition-all duration-200"
                    disabled={registerMutation.isPending}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Minimo 8 caracteres
                </p>
              </div>

              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-gradient-to-r from-[#FF8C42] to-[#FFD166] text-[#0D213B] font-semibold py-6 rounded-lg hover:shadow-[0_0_30px_rgba(255,140,66,0.4)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      className="h-5 w-5 border-2 border-[#0D213B] border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Crear Cuenta
                  </span>
                )}
              </Button>

              <div className="text-center text-sm text-gray-400">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  href="/login"
                  className="text-[#FF8C42] hover:text-[#FFD166] font-medium transition-colors"
                >
                  Inicia sesion aqui
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
