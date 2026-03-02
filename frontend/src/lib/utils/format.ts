import { format as dateFnsFormat, formatDistance as formatDateDistance, formatRelative } from 'date-fns';

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  }
  return `${distanceKm.toFixed(1)}km away`;
}

export function formatDate(date: string | Date, formatStr = 'PPP'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFnsFormat(d, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDateDistance(d, new Date(), { addSuffix: true });
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatPhone(phone: string): string {
  // Simple US phone formatting
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
