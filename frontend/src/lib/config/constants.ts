export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Stabix';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
export const ENABLE_WEBSOCKET = process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true';

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const SEARCH_DEFAULTS = {
  RADIUS_KM: 10,
  MIN_RADIUS: 1,
  MAX_RADIUS: 50,
} as const;

export const PRICE_BANDS = {
  budget: { label: 'Económico', symbol: '$' },
  standard: { label: 'Estándar', symbol: '$$' },
  premium: { label: 'Premium', symbol: '$$$' },
  luxury: { label: 'Lujo', symbol: '$$$$' },
} as const;

export const ORDER_STATUS = {
  created: { label: 'Created', color: 'blue' },
  paid: { label: 'Paid', color: 'green' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  completed: { label: 'Completed', color: 'emerald' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const;

export const JOB_STATUS = {
  open: { label: 'Open', color: 'blue' },
  matched: { label: 'Matched', color: 'purple' },
  ordered: { label: 'Ordered', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
} as const;

export const MATCH_STATUS = {
  pending: { label: 'Pending', color: 'yellow' },
  accepted: { label: 'Accepted', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  expired: { label: 'Expired', color: 'gray' },
} as const;

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROVIDER_PANEL: '/provider',
  LOGIN: '/login',
  REGISTER: '/register',
} as const;
