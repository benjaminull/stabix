'use client';

import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function WhatsAppButton({
  phoneNumber,
  message = '',
  className = '',
  size = 'default',
}: WhatsAppButtonProps) {
  const handleClick = () => {
    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');

    // Codificar el mensaje para URL
    const encodedMessage = encodeURIComponent(message);

    // Construir la URL de WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}${
      encodedMessage ? `?text=${encodedMessage}` : ''
    }`;

    // Abrir en una nueva ventana
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleClick}
      size={size}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Contactar por WhatsApp
    </Button>
  );
}

export function generateWhatsAppMessage(params: {
  customerName?: string;
  serviceName: string;
  location?: string;
  preferredDate?: string;
  details?: string;
}): string {
  const { customerName, serviceName, location, preferredDate, details } = params;

  let message = `¡Hola! Me contacto desde Stabix.\n\n`;

  if (customerName) {
    message += `Cliente: ${customerName}\n`;
  }

  message += `Servicio solicitado: ${serviceName}\n`;

  if (location) {
    message += `Ubicación: ${location}\n`;
  }

  if (preferredDate) {
    message += `Fecha preferida: ${preferredDate}\n`;
  }

  if (details) {
    message += `\nDetalles:\n${details}\n`;
  }

  message += `\n¿Podrías confirmar tu disponibilidad?`;

  return message;
}
