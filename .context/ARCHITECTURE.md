# ARCHITECTURE.md: Logic Distribution

## Supabase (Database Level)
- **Anti-Sniping:** Reset `live_end_at` via SQL Trigger.
- **Validation:** Basic bid increments and verification checks.
- **Security:** RLS to hide proxy bids.

## Backend (Application Level)
- **Proxy Engine:** Automatic counter-bidding logic.
- **AI Sentry:** Monitoring bid patterns for fraud.
- **Stream Sync:** Mapping YouTube timestamps to Bid timestamps.