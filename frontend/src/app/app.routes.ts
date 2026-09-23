import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { PublicLayoutComponent } from './shared/layouts/public-layout/public-layout';
import { DashboardLayoutComponent, DashboardNavItem } from './shared/layouts/dashboard-layout/dashboard-layout';

const customerNav: DashboardNavItem[] = [
  { label: 'Overview', path: '/dashboard', icon: 'dashboard', end: true },
  { label: 'My Tickets', path: '/dashboard/tickets', icon: 'ticket' },
  { label: 'My Orders', path: '/dashboard/orders', icon: 'orders' },
  { label: 'Profile', path: '/dashboard/profile', icon: 'profile' },
];

const organizerNav: DashboardNavItem[] = [
  { label: 'My Events', path: '/organizer/dashboard', icon: 'dashboard', end: true },
  { label: 'Create Event', path: '/organizer/events/new', icon: 'plus' },
  { label: 'Ticket Scanner', path: '/organizer/scanner', icon: 'scan' },
];

const affiliateNav: DashboardNavItem[] = [
  { label: 'Overview', path: '/affiliate/dashboard', icon: 'dashboard', end: true },
  { label: 'Commissions', path: '/affiliate/commissions', icon: 'credit-card' },
];

const adminNav: DashboardNavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: 'dashboard', end: true },
  { label: 'Events', path: '/admin/events', icon: 'calendar-event' },
  { label: 'Create Event', path: '/admin/events/new', icon: 'plus' },
  { label: 'Orders', path: '/admin/orders', icon: 'orders' },
  { label: 'Tickets', path: '/admin/tickets', icon: 'ticket' },
  { label: 'Scanner', path: '/admin/scanner', icon: 'scan' },
  { label: 'Users', path: '/admin/users', icon: 'users' },
  { label: 'Organizers', path: '/admin/organizers', icon: 'briefcase' },
  { label: 'Affiliates', path: '/admin/affiliates', icon: 'megaphone' },
  { label: 'Payments', path: '/admin/payments', icon: 'credit-card', superAdminOnly: true },
  { label: 'Payouts', path: '/admin/payouts', icon: 'wallet' },
  { label: 'Reports', path: '/admin/reports', icon: 'chart', superAdminOnly: true },
  { label: 'Admins', path: '/admin/admins', icon: 'shield', superAdminOnly: true },
  { label: 'Settings', path: '/admin/settings', icon: 'settings' },
];

export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./home/home').then((m) => m.HomeComponent) },
      { path: 'events', loadComponent: () => import('./events/event-list/event-list').then((m) => m.EventListComponent) },
      {
        path: 'events/:slug/checkout',
        canActivate: [authGuard],
        loadComponent: () => import('./events/checkout/checkout').then((m) => m.CheckoutComponent),
      },
      {
        path: 'events/:slug',
        loadComponent: () => import('./events/event-details/event-details').then((m) => m.EventDetailsComponent),
      },
      {
        path: 'orders/:reference/success',
        canActivate: [authGuard],
        loadComponent: () => import('./orders/order-success/order-success').then((m) => m.OrderSuccessComponent),
      },
      { path: 'blog', loadComponent: () => import('./blog/blog-list/blog-list').then((m) => m.BlogListComponent) },
      {
        path: 'blog/:slug',
        loadComponent: () => import('./blog/blog-details/blog-details').then((m) => m.BlogDetailsComponent),
      },
      { path: 'flights', loadComponent: () => import('./static/flights/flights').then((m) => m.FlightsComponent) },
      { path: 'holidays', loadComponent: () => import('./static/holidays/holidays').then((m) => m.HolidaysComponent) },
      { path: 'help', loadComponent: () => import('./static/help/help').then((m) => m.HelpComponent) },

      { path: 'auth/login', loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent) },
      { path: 'auth/register', loadComponent: () => import('./auth/register/register').then((m) => m.RegisterComponent) },
      {
        path: 'auth/forgot-password',
        loadComponent: () => import('./auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
      },
      {
        path: 'auth/reset-password/:token',
        loadComponent: () => import('./auth/reset-password/reset-password').then((m) => m.ResetPasswordComponent),
      },

      {
        path: 'organizer',
        loadComponent: () => import('./organizer/onboarding/onboarding').then((m) => m.OrganizerOnboardingComponent),
      },
      {
        path: 'affiliate',
        loadComponent: () => import('./affiliate/onboarding/onboarding').then((m) => m.AffiliateOnboardingComponent),
      },
    ],
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardLayoutComponent,
    data: { portalName: 'My Dashboard', navItems: customerNav },
    children: [
      { path: '', loadComponent: () => import('./dashboard/overview/overview').then((m) => m.DashboardOverviewComponent) },
      {
        path: 'tickets',
        loadComponent: () => import('./dashboard/my-tickets/my-tickets').then((m) => m.MyTicketsComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./dashboard/my-orders/my-orders').then((m) => m.MyOrdersComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/profile/profile').then((m) => m.ProfileComponent),
      },
    ],
  },

  {
    path: 'organizer/dashboard',
    canActivate: [authGuard, roleGuard(['organizer', 'admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Organizer Portal', navItems: organizerNav },
    children: [
      {
        path: '',
        loadComponent: () => import('./organizer/my-events/my-events').then((m) => m.OrganizerMyEventsComponent),
      },
    ],
  },
  {
    path: 'organizer/events/new',
    canActivate: [authGuard, roleGuard(['organizer', 'admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Organizer Portal', navItems: organizerNav },
    children: [
      { path: '', loadComponent: () => import('./organizer/event-form/event-form').then((m) => m.EventFormComponent) },
    ],
  },
  {
    path: 'organizer/events/:id/edit',
    canActivate: [authGuard, roleGuard(['organizer', 'admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Organizer Portal', navItems: organizerNav },
    children: [
      { path: '', loadComponent: () => import('./organizer/event-form/event-form').then((m) => m.EventFormComponent) },
    ],
  },
  {
    path: 'organizer/scanner',
    canActivate: [authGuard, roleGuard(['organizer', 'admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Organizer Portal', navItems: organizerNav },
    children: [{ path: '', loadComponent: () => import('./admin/scanner/scanner').then((m) => m.ScannerComponent) }],
  },

  {
    path: 'affiliate/dashboard',
    canActivate: [authGuard, roleGuard(['affiliate', 'admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Affiliate Portal', navItems: affiliateNav },
    children: [
      {
        path: '',
        loadComponent: () => import('./affiliate/dashboard/dashboard').then((m) => m.AffiliateDashboardComponent),
      },
    ],
  },
  {
    path: 'affiliate/commissions',
    canActivate: [authGuard, roleGuard(['affiliate', 'admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Affiliate Portal', navItems: affiliateNav },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./affiliate/commissions/commissions').then((m) => m.AffiliateCommissionsComponent),
      },
    ],
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    component: DashboardLayoutComponent,
    data: { portalName: 'Admin Portal', navItems: adminNav },
    children: [
      { path: '', loadComponent: () => import('./admin/dashboard/admin-dashboard').then((m) => m.AdminDashboardComponent) },
      {
        path: 'events',
        loadComponent: () => import('./admin/events/admin-events').then((m) => m.AdminEventsComponent),
      },
      {
        path: 'events/new',
        loadComponent: () => import('./organizer/event-form/event-form').then((m) => m.EventFormComponent),
      },
      {
        path: 'events/:id/edit',
        loadComponent: () => import('./organizer/event-form/event-form').then((m) => m.EventFormComponent),
      },
      { path: 'orders', loadComponent: () => import('./admin/orders/admin-orders').then((m) => m.AdminOrdersComponent) },
      {
        path: 'tickets',
        loadComponent: () => import('./admin/tickets/admin-tickets').then((m) => m.AdminTicketsComponent),
      },
      { path: 'scanner', loadComponent: () => import('./admin/scanner/scanner').then((m) => m.ScannerComponent) },
      { path: 'users', loadComponent: () => import('./admin/users/admin-users').then((m) => m.AdminUsersComponent) },
      {
        path: 'organizers',
        loadComponent: () => import('./admin/organizers/admin-organizers').then((m) => m.AdminOrganizersComponent),
      },
      {
        path: 'affiliates',
        loadComponent: () => import('./admin/affiliates/admin-affiliates').then((m) => m.AdminAffiliatesComponent),
      },
      {
        path: 'payouts',
        loadComponent: () => import('./admin/payouts/admin-payouts').then((m) => m.AdminPayoutsComponent),
      },
      {
        path: 'payments',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./admin/payments/admin-payments').then((m) => m.AdminPaymentsComponent),
      },
      {
        path: 'reports',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./admin/reports/admin-reports').then((m) => m.AdminReportsComponent),
      },
      {
        path: 'admins',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./admin/admins/admin-admins').then((m) => m.AdminAdminsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin/settings/admin-settings').then((m) => m.AdminSettingsComponent),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
