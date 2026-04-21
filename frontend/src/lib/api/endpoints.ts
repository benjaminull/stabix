/**
 * Centralized API endpoint definitions.
 * All paths are relative to API_BASE_URL (e.g. http://localhost:8000/api).
 */

export const endpoints = {
  auth: {
    token: '/v1/auth/token/',
    refresh: '/v1/auth/refresh/',
    register: '/v1/auth/register/',
  },
  public: {
    categories: '/v1/public/categories/',
    services: '/v1/public/services/',
    providers: '/v1/public/providers/',
    providerDetail: (id: number) => `/v1/public/providers/${id}/`,
    providerReviews: (id: number) => `/v1/public/providers/${id}/reviews/`,
    listings: '/v1/public/listings/',
    listingDetail: (id: number) => `/v1/public/listings/${id}/`,
    providerListings: (id: number) => `/v1/public/providers/${id}/listings/`,
    providerAvailableSlots: (id: number) => `/v1/public/providers/${id}/available-slots/`,
    book: '/v1/public/book/',
  },
  customer: {
    me: '/v1/customer/me/',
    jobRequests: '/v1/customer/job-requests/',
    jobRequestDetail: (id: number) => `/v1/customer/job-requests/${id}/`,
    jobRequestMatch: (id: number) => `/v1/customer/job-requests/${id}/match/`,
    jobMatches: (jobRequestId: number) => `/v1/customer/job-requests/${jobRequestId}/matches/`,
    orders: '/v1/customer/orders/',
    orderDetail: (id: number) => `/v1/customer/orders/${id}/`,
    orderReview: (orderId: number) => `/v1/customer/orders/${orderId}/reviews/`,
    orderMessages: (orderId: number) => `/v1/customer/orders/${orderId}/messages/`,
  },
  provider: {
    me: '/v1/provider/me/',
    dashboard: '/v1/provider/dashboard/',
    availability: '/v1/provider/availability/',
    listings: '/v1/provider/listings/',
    listingDetail: (id: number) => `/v1/provider/listings/${id}/`,
    matches: '/v1/provider/matches/',
    matchAccept: (id: number) => `/v1/provider/matches/${id}/accept/`,
    matchReject: (id: number) => `/v1/provider/matches/${id}/reject/`,
    orders: '/v1/provider/orders/',
    orderStatus: (id: number) => `/v1/provider/orders/${id}/status/`,
  },
  common: {
    notifications: '/v1/common/notifications/',
    notificationRead: (id: number) => `/v1/common/notifications/${id}/read/`,
    notificationsMarkAllRead: '/v1/common/notifications/mark-all-read/',
    notificationsUnreadCount: '/v1/common/notifications/unread-count/',
  },
} as const;
