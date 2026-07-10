// yss_orbit\frontend\src\modules\integration\routes\integrationRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { IntegrationListPage } from '../pages/integrationListPage';
// @ts-expect-error - Auto-patched TS2307
import { IntegrationDetailPage } from '../pages/integrationDetailPage';
// @ts-expect-error - Auto-patched TS2307
import { OAuthPage } from '../pages/OAuthPage';
// @ts-expect-error - Auto-patched TS2307
import { WebhookPage } from '../pages/WebhookPage';

export const integrationRoutes: RouteObject[] = [
  { path: '', element: <IntegrationListPage /> },
  { path: 'oauth', element: <OAuthPage /> },
  { path: 'webhooks', element: <WebhookPage /> },
  { path: ':id', element: <IntegrationDetailPage /> },
];
