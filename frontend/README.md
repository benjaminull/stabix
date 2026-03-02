# Stabix Frontend

Modern Next.js 14 frontend for the Stabix on-demand services marketplace.

## Features

- 🎨 **Dark Theme UI** - Custom dark theme with brand colors (orange/yellow accents)
- 🗺️ **Geospatial Search** - Mapbox integration with radius-based provider search
- 🔐 **JWT Authentication** - Secure auth with automatic token refresh
- ⚡ **Server-Side Rendering** - Next.js App Router with ISR
- 📱 **Responsive Design** - Mobile-first with TailwindCSS
- 🎯 **Type-Safe API** - Fully typed API client with React Query
- 🧪 **Testing** - Vitest + React Testing Library + Playwright

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State**: Zustand (auth, filters, UI state)
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: react-hook-form + Zod validation
- **Maps**: Mapbox GL JS
- **Testing**: Vitest + Playwright
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running at http://localhost:8000
- Mapbox account (for map features)

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Mapbox Configuration (Get token at https://account.mapbox.com/)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Stabix
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_WEBSOCKET=false
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (marketing)/        # Marketing pages (landing)
│   │   ├── dashboard/          # User dashboard
│   │   ├── search/             # Provider search with map
│   │   ├── providers/[id]/     # Provider detail page
│   │   ├── jobs/               # Job request flow
│   │   ├── orders/[id]/        # Order details
│   │   ├── chat/[orderId]/     # Chat interface
│   │   ├── profile/            # User profile
│   │   ├── provider/           # Provider panel
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── providers.tsx       # React Query provider
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Header, Footer, Shell
│   │   ├── common/             # Reusable components
│   │   ├── forms/              # Form components
│   │   └── chat/               # Chat components
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts       # API client with JWT
│   │   │   └── hooks/          # React Query hooks
│   │   ├── store/              # Zustand stores
│   │   ├── config/             # App configuration
│   │   └── utils/              # Utility functions
│   │
│   ├── styles/
│   │   └── globals.css         # Global styles
│   │
│   └── tests/
│       ├── unit/               # Vitest tests
│       └── e2e/                # Playwright tests
│
├── public/
│   ├── icons/
│   └── images/
│
├── package.json
├── tsconfig.json
├── tailwind.config.cjs
├── next.config.mjs
└── README.md
```

## Available Scripts

### Development

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Testing

```bash
npm run test         # Run Vitest unit tests
npm run test:ui      # Run tests with UI
npm run e2e          # Run Playwright e2e tests
npm run e2e:ui       # Run e2e tests with UI
```

### API Client Generation

```bash
npm run gen:api      # Generate types from OpenAPI schema
```

This reads `src/app/api/schema.json` and generates TypeScript types.

## API Integration

### Setting Up API Connection

The frontend connects to the backend via the configured `NEXT_PUBLIC_API_BASE_URL`.

1. **Start Backend**:
   ```bash
   cd ../backend
   make dev
   ```

2. **Verify Connection**:
   Open http://localhost:3000 - the app will fetch categories from the backend.

### Generating API Client

To update the API client when the backend changes:

1. **Export Backend Schema**:
   ```bash
   cd ../backend
   make schema  # Generates schema.yml
   ```

2. **Copy to Frontend**:
   ```bash
   cp ../backend/schema.yml frontend/src/app/api/schema.json
   ```

3. **Generate Types**:
   ```bash
   cd frontend
   npm run gen:api
   ```

This creates `src/lib/api/types.ts` with fully typed API definitions.

### Authentication Flow

```typescript
import { useLogin } from '@/lib/api/hooks/useAuth';
import { useAuthStore } from '@/lib/store/auth.store';

// Login
const { mutateAsync: login } = useLogin();
await login({ email: 'user@example.com', password: 'password' });

// Access token automatically included in authenticated requests
const { data } = useProviders({ lat: 34.0522, lng: -118.2437, radius_km: 10 });

// Logout
const { logout } = useAuthStore();
logout();
```

## Key Routes

### Public Routes

- `/` - Landing page with hero and category pills
- `/search` - Provider search with filters and map
- `/providers/[id]` - Provider detail with reviews

### Protected Routes (require auth)

- `/dashboard` - User dashboard (job requests + orders)
- `/jobs/new` - Create new job request
- `/jobs/[id]` - Job request detail with matches
- `/orders/[id]` - Order details with chat
- `/chat/[orderId]` - Dedicated chat interface
- `/profile` - User profile and settings
- `/provider` - Provider panel (if user.is_provider)

## State Management

### Zustand Stores

#### Auth Store (`useAuthStore`)

```typescript
const { user, isAuthenticated, login, logout } = useAuthStore();
```

Handles JWT tokens and user session. Persisted to localStorage.

#### Filters Store (`useFiltersStore`)

```typescript
const { query, category, location, radiusKm, setLocation } = useFiltersStore();
```

Manages search filters state.

#### UI Store (`useUIStore`)

```typescript
const { theme, toggleTheme, selectedProviderId } = useUIStore();
```

Controls UI state like theme, drawers, selected items.

## React Query Hooks

All API interactions use React Query for caching and state management:

```typescript
// Fetch providers
const { data, isLoading } = useProviders({
  lat: 34.0522,
  lng: -118.2437,
  radius_km: 10,
  category: 'home-services',
});

// Create job request
const createJob = useCreateJobRequest();
await createJob.mutateAsync({
  service: 1,
  location_lat: 34.0522,
  location_lng: -118.2437,
  details: 'Need plumbing repair',
  budget_estimate: '150.00',
});

// Run matching
const runMatching = useRunMatching(jobRequestId);
await runMatching.mutateAsync();
```

## Styling

### Theme Configuration

Brand colors defined in `tailwind.config.cjs`:

```css
brand-900: #0D213B  /* Main background */
brand-800: #131416  /* Dark anthracite */
accent-500: #FF8C42 /* Orange accent */
accent-400: #FFD166 /* Golden yellow */
```

### Using Components

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

<Button variant="default">Click me</Button>
<Card>...</Card>
<Badge variant="outline">New</Badge>
```

### Custom Utilities

```tsx
import { cn } from '@/lib/utils/clsx';

<div className={cn('base-class', condition && 'conditional-class')} />
```

## Maps Integration

### Mapbox Setup

1. **Get API Token**: https://account.mapbox.com/access-tokens/
2. **Add to .env.local**: `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx`

### Using Maps

```tsx
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/common/MapView'), {
  ssr: false,
});

<MapView
  providers={data?.results || []}
  center={{ lat: 34.0522, lng: -118.2437 }}
  zoom={11}
/>
```

## Forms

### Using react-hook-form with Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

<Input {...register('email')} />
{errors.email && <p>{errors.email.message}</p>}
```

## Testing

### Unit Tests (Vitest)

```bash
npm run test
```

Example test:

```typescript
import { render, screen } from '@testing-library/react';
import { ProviderCard } from '@/components/common/ProviderCard';

test('renders provider card', () => {
  render(<ProviderCard provider={mockProvider} />);
  expect(screen.getByText(mockProvider.user_email)).toBeInTheDocument();
});
```

### E2E Tests (Playwright)

```bash
npm run e2e
```

Example test:

```typescript
import { test, expect } from '@playwright/test';

test('search for providers', async ({ page }) => {
  await page.goto('/search');
  await page.fill('input[placeholder*="necesitas"]', 'plumbing');
  await page.click('button[type="submit"]');
  await expect(page.locator('.provider-card')).toBeVisible();
});
```

## Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables for Production

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.stabix.com/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_production_token
NEXT_PUBLIC_APP_URL=https://stabix.com
```

### Deploy to Vercel

```bash
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Troubleshooting

### API Connection Issues

**Problem**: Cannot connect to backend

**Solution**:
1. Verify backend is running: `curl http://localhost:8000/api/categories/`
2. Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. CORS is configured in backend settings

### Mapbox Not Loading

**Problem**: Map doesn't render

**Solution**:
1. Verify `NEXT_PUBLIC_MAPBOX_TOKEN` is set
2. Check token is valid at https://account.mapbox.com/
3. Map component must be client-side: `'use client'`

### Authentication Issues

**Problem**: Token expired or login fails

**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Check backend JWT settings
3. Verify token refresh logic in `auth.store.ts`

### Build Errors

**Problem**: Type errors during build

**Solution**:
```bash
npm run gen:api  # Regenerate API types
npm run lint     # Fix linting issues
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari, Chrome Android

## Performance

- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: < 300KB initial JS
- **Time to Interactive**: < 3s on 3G

## Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm run test && npm run e2e`
4. Format code: `npm run format`
5. Submit PR

## License

MIT

## Support

- Documentation: See `/docs`
- Issues: GitHub Issues
- Backend API: See `../backend/README.md`
