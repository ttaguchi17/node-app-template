# Backend Architecture

## Modular Route Structure

The backend now uses a **hub-and-spoke** architecture where `trips.js` acts as the central hub and delegates to specialized modules.

```
server.js
  ├── /api/trips → trips.js (HUB)
  │     ├── GET    /                          → List all trips for user
  │     ├── POST   /                          → Create new trip
  │     ├── GET    /:tripId                   → Get single trip
  │     ├── PATCH  /:tripId                   → Update trip
  │     ├── DELETE /:tripId                   → Delete trip
  │     │
  │     ├── /:tripId/members → members.js (SPOKE)
  │     │     ├── GET    /                    → List trip members
  │     │     ├── POST   /:userId/accept      → Accept invitation
  │     │     └── PATCH  /:userId             → Update member role
  │     │
  │     ├── /:tripId/events → events.js (SPOKE)
  │     │     ├── GET    /                    → List trip events
  │     │     ├── POST   /                    → Create event (manual or imported)
  │     │     ├── PATCH  /:eventId            → Update event
  │     │     └── DELETE /:eventId            → Delete event
  │     │
  │     └── /:tripId/invitations → invitations.js (SPOKE)
  │           └── POST   /                    → Send invitations (requires trip context)
  │
  └── /api/invitations → invitation-actions.js (GLOBAL)
        ├── GET    /                          → Get my pending invitations
        └── POST   /:invitationId/respond     → Accept/decline invitation (standalone)
```

## Key Benefits

### ✅ No Duplicate Routes
- Each endpoint has ONE implementation
- Clear ownership of functionality
- No mount conflicts

### ✅ Modular & Maintainable
- `members.js` - All member management logic
- `events.js` - All event/itinerary logic  
- `invitations.js` - Trip-scoped invitation sending
- `invitation-actions.js` - Global invitation responses (no trip context needed)
- `trips.js` - Trip CRUD + delegation only

### ✅ Clean URL Structure
Trip-scoped routes (need trip context):
- `/api/trips/:tripId/members`
- `/api/trips/:tripId/events`
- `/api/trips/:tripId/invitations` - Send invites

Global routes (work standalone):
- `/api/invitations` - List my invites
- `/api/invitations/:invitationId/respond` - Accept/decline (perfect for email links!)

### ✅ Email-Friendly URLs
Users can accept invitations directly from email links:
```
https://myapp.com/accept-invite/99
   ↓ Frontend calls
POST /api/invitations/99/respond
   ↓ No need to know trip ID!

## Implementation Details

### trips.js (Hub)
```javascript
const membersRouter = require('./members');
const eventsRouter = require('./events');
const invitationsRouter = require('./invitations');

// Delegate to sub-routers
router.use('/:tripId/members', membersRouter);
router.use('/:tripId/events', eventsRouter);
router.use('/:tripId/invitations', invitationsRouter);
```

### Sub-routers (Spokes)
Each sub-router uses `mergeParams: true` to access `:tripId` from parent:
```javascript
const router = express.Router({ mergeParams: true });
```

## Deleted Files (Unused/Redundant)

- ❌ `routes/emails.js` - Unused extraction route
- ❌ `utils/mappers.js` - Unused data mappers
- ❌ `services/emailExtractor.js` - Unused Python service caller

## Active Routes

| File | Purpose | Mounted At |
|------|---------|------------|
| `auth.js` | Authentication | `/api/auth` |
| `trips.js` | Trip CRUD + Hub | `/api/trips` |
| `members.js` | Member management | `/api/trips/:tripId/members` |
| `events.js` | Event/itinerary | `/api/trips/:tripId/events` |
| `invitations.js` | Send invitations | `/api/trips/:tripId/invitations` |
| `invitation-actions.js` | Respond to invitations | `/api/invitations` |
| `gmail.js` | Gmail OAuth & scan | `/api/gmail` |
| `users.js` | User search | `/api/users` |
| `notifications.js` | Notifications | `/api/notifications` |
