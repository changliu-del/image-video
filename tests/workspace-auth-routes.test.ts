import { describe, expect, it } from 'vitest';

import { workspaceRouteRequiresAuth } from '../lib/auth/workspace-routes';

describe('workspace route auth boundary', () => {
  it('allows anonymous users to enter workbench and hub routes', () => {
    expect(workspaceRouteRequiresAuth('/dashboard')).toBe(false);
    expect(workspaceRouteRequiresAuth('/create')).toBe(false);
    expect(workspaceRouteRequiresAuth('/create/video')).toBe(false);
    expect(workspaceRouteRequiresAuth('/create/apparel')).toBe(false);
    expect(workspaceRouteRequiresAuth('/create/try-on')).toBe(false);
    expect(workspaceRouteRequiresAuth('/generate')).toBe(false);
  });

  it('requires auth for account, billing, admin, and personal job routes', () => {
    expect(workspaceRouteRequiresAuth('/dashboard/profile')).toBe(true);
    expect(workspaceRouteRequiresAuth('/dashboard/history')).toBe(true);
    expect(workspaceRouteRequiresAuth('/dashboard/billing')).toBe(true);
    expect(workspaceRouteRequiresAuth('/dashboard/credits')).toBe(true);
    expect(workspaceRouteRequiresAuth('/dashboard/security')).toBe(true);
    expect(workspaceRouteRequiresAuth('/dashboard/general')).toBe(true);
    expect(workspaceRouteRequiresAuth('/admin')).toBe(true);
    expect(workspaceRouteRequiresAuth('/jobs/123')).toBe(true);
    expect(workspaceRouteRequiresAuth('/pricing')).toBe(true);
  });
});
