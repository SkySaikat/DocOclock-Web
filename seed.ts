/**
 * Seed data initialization is now handled via Supabase direct migrations or 
 * async seeding utilities. Legacy synchronous seeding is disabled.
 */
export function initializeDemoData() {
  // Disabled legacy seeding
  console.log('[DocOclock] Legacy demo seeding skipped. Using Supabase cloud data.');
}
