/**
 * Marketing / platform content: medicines catalog, homepage banners, blog posts, settings, theme.
 */
import { MEDICINES } from './clinical';
import { NS, Seed, uuid } from './util';

const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

export function buildContent(): Seed {
  return {
    medicines: MEDICINES,

    hero_banners: [
      { id: uuid(NS.banner, 1), desktop_image_url: '/assets/figma/dashboard-mockup.png', mobile_image_url: '/assets/figma/dashboard-mockup.png', title: 'Live queue, zero waiting-room stress', subtitle: null, sort_order: 1, is_active: true, created_at: day(40) },
      { id: uuid(NS.banner, 2), desktop_image_url: '/assets/figma/process-card-1.png', mobile_image_url: null, title: 'Find verified specialists', subtitle: null, sort_order: 2, is_active: true, created_at: day(39) },
      { id: uuid(NS.banner, 3), desktop_image_url: '/assets/figma/process-card-2.png', mobile_image_url: null, title: 'Book in two taps', subtitle: null, sort_order: 3, is_active: true, created_at: day(38) },
    ],

    blog_posts: [
      { id: uuid(NS.blog, 1), title: 'How live serial tracking saves you two hours a visit', slug: 'live-serial-tracking', excerpt: 'Watch your place in the queue update in real time and arrive exactly when it is your turn.', cover_image_url: '/assets/figma/process-card-1.png', is_published: true, published_at: day(3), created_at: day(3) },
      { id: uuid(NS.blog, 2), title: 'Reading your prescription: doses, timing and what "1+0+1" means', slug: 'reading-your-prescription', excerpt: 'A plain-language guide to morning / noon / night dosing and before- vs after-meal instructions.', cover_image_url: '/assets/figma/process-card-2.png', is_published: true, published_at: day(9), created_at: day(9) },
      { id: uuid(NS.blog, 3), title: 'Five questions to ask before your first cardiology visit', slug: 'first-cardiology-visit', excerpt: 'Prepare your history, medications and questions so a 10-minute consult goes further.', cover_image_url: '/assets/figma/dashboard-mockup.png', is_published: true, published_at: day(16), created_at: day(16) },
      { id: uuid(NS.blog, 4), title: 'Managing chronic conditions with the Medicine Tracker', slug: 'medicine-tracker-guide', excerpt: 'Turn every prescription into a daily schedule and never miss a dose.', cover_image_url: '/assets/figma/dashboard-mockup-2.png', is_published: true, published_at: day(24), created_at: day(24) },
      { id: uuid(NS.blog, 5), title: 'For doctors: run a smoother chamber with the Serial Manager', slug: 'serial-manager-for-doctors', excerpt: 'Reserved slots, late arrivals and delay alerts — how top chambers keep the queue moving.', cover_image_url: '/assets/figma/hero-doctor.png', is_published: true, published_at: day(31), created_at: day(31) },
      { id: uuid(NS.blog, 6), title: 'Draft: winter health checklist', slug: 'winter-health-checklist', excerpt: 'Unpublished draft (should not appear on /blogs).', cover_image_url: null, is_published: false, published_at: day(1), created_at: day(1) },
    ],

    contact_messages: [],

    system_settings: [
      { key: 'location_search_enabled', value: false },
      { key: 'max_booking_days_ahead', value: 30 },
      { key: 'platform_name', value: 'DocOclock' },
    ],

    // Same defaults as MIGRATION_THEME_SETTINGS.sql / contexts/ThemeContext DEFAULT_THEME.
    theme_settings: [{ id: 1, primary_color: '#0ca768', secondary_color: '#03402a', background_color: '#f5f7f6', updated_by: null, updated_at: day(30) }],

    email_otps: [],
    login_attempts: [],
    audit_logs: [],
  };
}
