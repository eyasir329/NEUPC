# Event Registration Implementation Guide

Maps the documented workflows to actual codebase locations.

## 🗺️ Code File Map

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| **Registration UI** | `app/events/[eventId]/EventRegistrationCard.js` | 400+ | Client-side registration form, team member search, invite responses |
| **Server Logic** | `app/_lib/member-events-actions.js` | 500+ | Core registration validation, cancellation, team invites |
| **Dashboard UI** | `app/account/member/events/_components/MemberEventsClient.js` | 300+ | Status display, cancel button, registration list |
| **Database Layer** | `app/_lib/data-service.js` | Helper | CRUD operations for registrations |
| **Schema** | `docs/database/schema.sql` | Full | Database tables: `event_registrations`, `event_registration_members`, `events` |

---

## 📋 Individual Registration Walkthrough

### 1. User Clicks "Register Now"

**File:** `app/events/[eventId]/EventRegistrationCard.js`

```javascript
const handleRegister = useCallback(() => {
  setError(null);
  startTransition(async () => {
    // Check if team event
    let teamData = undefined;
    if (isTeamEvent) {
      teamData = {
        teamName,
        teamMembers: teamMembers.map((m) => m.id),
      };
    }
    
    // Call server action
    const result = await registerForEventAction(event.id, teamData);
    
    if (result?.error) {
      setError(result.error);  // Show error to user
    } else {
      setSuccess(true);  // Show success
      // Refresh registration status
      const regRes = await getMyRegistrationAction(event.id);
      if (regRes.registration) setRegistration(regRes.registration);
    }
  });
}, [event.id, isTeamEvent, teamName, teamMembers, startTransition]);
```

### 2. Server Validates & Registers

**File:** `app/_lib/member-events-actions.js` (Lines 58-500)

**Function:** `registerForEventAction(eventId, teamData?)`

```javascript
export async function registerForEventAction(eventId, teamData) {
  // 1. Fetch event data
  const { data: event, error: eventError } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (!event) return { error: 'Event not found.' };

  // 2. Validate event status
  if (!['upcoming', 'ongoing'].includes(event.status)) {
    return { error: 'Event registration is closed.' };
  }

  // 3. Check registration deadline
  if (new Date(event.registration_deadline) < new Date()) {
    return { error: 'Registration deadline has passed.' };
  }

  // 4. Check eligibility
  const isEligible = await checkEligibility(userId, event.eligibility);
  if (!isEligible) {
    return { error: 'You are not eligible for this event.' };
  }

  // 5. For individual registration
  if (!teamData) {
    // Check capacity
    const { count: regCount } = await supabaseAdmin
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered');

    if (regCount >= event.max_participants) {
      return { error: 'Event is full.' };
    }

    // INSERT into database
    const { data: registration, error: insertError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'registered',
        registered_at: new Date(),
      })
      .select()
      .single();

    if (insertError) return { error: 'Registration failed.' };

    // Revalidate page to refresh UI
    revalidatePath(`/events/${eventId}`);
    revalidatePath('/account/member/events');
    
    return { success: true };
  }

  // 6. For team registration
  if (event.participation_type === 'team') {
    if (!teamData?.teamName?.trim()) {
      return { error: 'Team name is required.' };
    }

    // Get team member IDs (ensure no duplicates)
    const memberIds = [...new Set(teamData.teamMembers)];
    
    // Check team size
    if (event.team_size && memberIds.length !== event.team_size) {
      return { error: `Team must have exactly ${event.team_size} members.` };
    }

    // Check all members are eligible
    for (const memberId of memberIds) {
      const eligible = await checkEligibility(memberId, event.eligibility);
      if (!eligible) {
        return { error: `Not all team members are eligible.` };
      }
    }

    // Check no members already registered as leaders
    const { data: existingRegs } = await supabaseAdmin
      .from('event_registrations')
      .select('user_id')
      .eq('event_id', eventId)
      .in('user_id', memberIds)
      .eq('status', 'registered');

    if (existingRegs.length > 0) {
      return { error: 'One or more team members already registered.' };
    }

    // INSERT team registration
    const { data: registration, error: insertError } = await supabaseAdmin
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: userId,  // Team leader
        team_name: teamData.teamName,
        team_members: memberIds,  // Array of all member IDs
        status: 'registered',
        registered_at: new Date(),
      })
      .select()
      .single();

    if (insertError) return { error: 'Registration failed.' };

    const registrationId = registration.id;

    // INSERT team member tracking rows
    const memberRows = memberIds.map((memberId) => ({
      registration_id: registrationId,
      user_id: memberId,
      is_leader: memberId === userId,
      status: memberId === userId ? 'accepted' : 'pending',
      responded_at: memberId === userId ? new Date() : null,
    }));

    const { error: memberError } = await supabaseAdmin
      .from('event_registration_members')
      .insert(memberRows);

    if (memberError) return { error: 'Failed to add team members.' };

    revalidatePath(`/events/${eventId}`);
    revalidatePath('/account/member/events');
    
    return { success: true };
  }
}
```

### 3. User Sees Success

**File:** `app/events/[eventId]/EventRegistrationCard.js`

```javascript
// Success state:
<div className="text-green-600 flex items-center gap-2">
  <CheckCircle2 className="w-5 h-5" />
  <span>✓ Registered</span>
</div>

// Can now cancel:
{canCancel && (
  <button onClick={handleCancel} className="text-red-600">
    Cancel Registration
  </button>
)}
```

---

## 👥 Team Registration Walkthrough

### 1. Team Lead Clicks "Register as Team"

**UI:** `app/events/[eventId]/EventRegistrationCard.js` (search + chip UI)

```javascript
// Team member search component
<TeamMemberSearch
  onAdd={(member) => setTeamMembers([...teamMembers, member])}
  eventId={event.id}
  excluded={[userId, ...teamMembers.map(m => m.id)]}
/>

// Selected members shown as chips
{teamMembers.map((member) => (
  <MemberChip
    key={member.id}
    name={member.full_name}
    avatar={member.avatar_url}
    onRemove={() => setTeamMembers(teamMembers.filter(m => m.id !== member.id))}
  />
))}
```

### 2. Search Function (Excludes Already Registered)

**File:** `app/_lib/member-events-actions.js` (searchUsersForTeamAction)

```javascript
export async function searchUsersForTeamAction(query, roleId, eventId) {
  // Minimum query length
  if (!query || query.length < 2) return [];

  // Get user IDs with required role (if specified)
  let availableUserIds = null;
  if (roleId && roleId !== 'all') {
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role_id', roleId);
    
    availableUserIds = userRoles?.map(ur => ur.user_id) || [];
  }

  // Build exclude set
  const excludeIds = new Set([userId]); // Always exclude self

  // Exclude already-registered users
  const { data: regs } = await supabaseAdmin
    .from('event_registrations')
    .select('user_id, team_members')
    .eq('event_id', eventId)
    .eq('status', 'registered');

  regs?.forEach(reg => {
    excludeIds.add(reg.user_id);  // Team leaders
    reg.team_members?.forEach(id => excludeIds.add(id));  // Team members
  });

  // Search users
  let query_builder = supabaseAdmin
    .from('users')
    .select('id, full_name, email, avatar_url')
    .ilike('full_name', `%${query}%`)
    .eq('account_status', 'active');

  if (availableUserIds) {
    query_builder = query_builder.in('id', availableUserIds);
  }

  const { data: results } = await query_builder.limit(20);

  // Filter to remove excluded users
  return results.filter(u => !excludeIds.has(u.id));
}
```

### 3. Submit Team Registration

**Same as Individual** (see above), but with `teamData` parameter containing team name and member IDs.

### 4. Team Members Receive Invites

**Who gets notified:**

- All members except team lead receive `event_registration_members.status = 'pending'`
- Non-leaders see "Accept" / "Decline" buttons in their UI

**File:** `app/events/[eventId]/EventRegistrationCard.js` (if user is invited member)

```javascript
// Show pending invite if user is non-leader member
{myInviteStatus === 'pending' && (
  <div className="bg-blue-50 p-4 rounded">
    <p>You've been invited to join [Team Name]</p>
    <button onClick={handleAccept}>Accept</button>
    <button onClick={handleDecline}>Decline</button>
  </div>
)}
```

### 5. Member Responds to Invite

**File:** `app/_lib/member-events-actions.js` (respondToTeamInviteAction)

```javascript
export async function respondToTeamInviteAction(registrationId, accept) {
  // Find this user's member row
  const { data: memberRow } = await supabaseAdmin
    .from('event_registration_members')
    .select('*')
    .eq('registration_id', registrationId)
    .eq('user_id', userId)
    .single();

  if (!memberRow) return { error: 'Invite not found.' };

  // Only non-leaders can respond
  if (memberRow.is_leader) {
    return { error: 'You are the team leader.' };
  }

  // Update status
  const newStatus = accept ? 'accepted' : 'declined';
  const { error } = await supabaseAdmin
    .from('event_registration_members')
    .update({
      status: newStatus,
      responded_at: new Date(),
    })
    .eq('id', memberRow.id);

  if (error) return { error: 'Failed to respond.' };

  return { success: true, status: newStatus };
}
```

---

## ❌ Cancellation Walkthrough

### 1. User Clicks Cancel

**File:** `app/events/[eventId]/EventRegistrationCard.js`

```javascript
const handleCancel = async () => {
  if (confirm('Cancel registration?')) {
    startTransition(async () => {
      const result = await cancelEventRegistrationAction(event.id);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess('Registration cancelled');
        // Refresh status
        const regRes = await getMyRegistrationAction(event.id);
        if (regRes.registration) setRegistration(regRes.registration);
      }
    });
  }
};
```

### 2. Server Validates Cancellation

**File:** `app/_lib/member-events-actions.js` (cancelEventRegistrationAction)

```javascript
export async function cancelEventRegistrationAction(eventId) {
  // Fetch user's registration
  const { data: registration } = await supabaseAdmin
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (!registration) return { error: 'Not registered.' };

  // Only team leaders can cancel team registrations
  if (registration.team_members && !registration.is_leader) {
    return { error: 'You are a member of ' + registration.team_name + '. Only the team leader can cancel.' };
  }

  // Cannot cancel if confirmed or attended
  if (['confirmed', 'attended'].includes(registration.status)) {
    return { error: 'Contact the club to cancel.' };
  }

  // Soft delete: update status to 'cancelled'
  const { error: updateError } = await supabaseAdmin
    .from('event_registrations')
    .update({ status: 'cancelled' })
    .eq('id', registration.id);

  if (updateError) return { error: 'Cancellation failed.' };

  // Clean up team member rows if team registration
  if (registration.team_members) {
    await supabaseAdmin
      .from('event_registration_members')
      .delete()
      .eq('registration_id', registration.id);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath('/account/member/events');
  
  return { success: true };
}
```

---

## 📊 Database Schema Reference

### event_registrations

```sql
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,  -- Team lead if team registration
  
  -- NULL for individual registrations
  team_name text,
  team_members uuid[]  -- Array of member IDs including team lead
  
  -- For guest registrations
  registration_data jsonb,  -- { guest_name, guest_email, guest_phone }
  
  status text DEFAULT 'registered'::text 
    CHECK (status = ANY (ARRAY[
      'registered'::text, 
      'confirmed'::text, 
      'cancelled'::text, 
      'attended'::text
    ])),
  
  attended boolean DEFAULT false,
  certificate_issued boolean DEFAULT false,
  registered_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### event_registration_members (Team member tracking)

```sql
CREATE TABLE public.event_registration_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL,  -- FK to event_registrations
  user_id uuid NOT NULL,          -- FK to users
  
  is_leader boolean NOT NULL DEFAULT false,  -- true if team lead
  
  status text NOT NULL DEFAULT 'pending'::text 
    CHECK (status = ANY (ARRAY[
      'pending'::text,      -- Awaiting response
      'accepted'::text,     -- Accepted invite
      'declined'::text      -- Declined invite
    ])),
  
  responded_at timestamp with time zone,  -- When they responded
  
  PRIMARY KEY (id),
  FOREIGN KEY (registration_id) REFERENCES event_registrations(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

- **Leader gets:** `is_leader=true`, `status='accepted'`, `responded_at=NOW()` (auto-accepted)
- **Members get:** `is_leader=false`, `status='pending'`, `responded_at=NULL` (pending response)
- After member accepts: `status='accepted'`, `responded_at=NOW()`
- After member declines: `status='declined'`, `responded_at=NOW()`

---

## 🔍 Validation Rules (Enforced in registerForEventAction)

| Validation | Failure Message | Code Location |
|-----------|------------------|---------------|
| Event exists | "Event not found." | Line ~80 |
| Event upcoming/ongoing | "Event registration is closed." | Line ~85 |
| Deadline not passed | "Registration deadline has passed." | Line ~92 |
| User eligible | "You are not eligible for this event." | Line ~98 |
| Event not full | "Event is full." | Line ~120 |
| Team name provided | "Team name is required." | Line ~185 |
| Team size matches | "Team must have exactly N members." | Line ~195 |
| All members eligible | "Not all team members are eligible." | Line ~200+ |
| No member already lead | "One or more members already registered." | Line ~215 |

---

## 🔄 State Transitions

### Individual Registration States

```
Not Registered
    ↓ [Click Register]
Registered (status='registered')
    ├─ [Organizer confirms] → Confirmed (status='confirmed')
    │  ├─ [Organizer marks present] → Attended (status='attended')
    │  └─ [Can't cancel] → "Contact club"
    │
    └─ [Click Cancel] → Cancelled (status='cancelled')
       [Can re-register]
```

### Team Registration Member States

```
Pending (invited but not responded)
    ├─ [Click Accept] → Accepted
    └─ [Click Decline] → Declined

Team Lead (is_leader=true):
    → Accepted (auto-accepted)
    
Non-Lead (is_leader=false):
    → Pending (awaits response)
```

---

## 🧪 Testing & Debug

### Check User's Registration Status

**Function:** `getMyRegistrationAction(eventId)`

```javascript
export async function getMyRegistrationAction(eventId) {
  // Check if user is team lead
  const { data: asLeader } = await supabaseAdmin
    .from('event_registrations')
    .select('*, event_registration_members(*)')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single();

  if (asLeader) {
    return {
      registration: {
        id: asLeader.id,
        status: asLeader.status,
        isTeamLeader: true,
        teamName: asLeader.team_name,
        teamMembers: asLeader.team_members,
        memberStatuses: asLeader.event_registration_members,
      }
    };
  }

  // Check if user is team member
  const { data: asMember } = await supabaseAdmin
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .contains('team_members', [userId])
    .single();

  if (asMember) {
    const { data: memberRow } = await supabaseAdmin
      .from('event_registration_members')
      .select('*')
      .eq('registration_id', asMember.id)
      .eq('user_id', userId)
      .single();

    return {
      registration: {
        id: asMember.id,
        status: asMember.status,
        isTeamLeader: false,
        teamName: asMember.team_name,
        myAcceptance: memberRow?.status,
      }
    };
  }

  // Not registered
  return { registration: null };
}
```

**Returns:**

```javascript
{
  registration: {
    id: "uuid...",
    status: "registered",
    isTeamLeader: true,  // or false, or null
    teamName: "Alpha Coders",
    teamMembers: ["id1", "id2"],
    memberStatuses: [
      { user_id: "id1", status: "accepted", is_leader: true },
      { user_id: "id2", status: "pending", is_leader: false }
    ]
  }
}
```

---

## 📝 Error Codes & Messages

All errors returned as: `{ error: "Human-readable message" }`

Common errors:

- "Event not found."
- "Event registration is closed."
- "Registration deadline has passed."
- "You are not eligible for this event."
- "Event is full."
- "Team name is required."
- "Team must have exactly 3 members (got 2)."
- "Not all team members are eligible."
- "One or more team members already registered."
- "Registration failed."
- "Not registered."
- "You are a member of Alpha Coders. Only the team leader can cancel."
- "Contact the club to cancel."

---

## 💡 Key Implementation Notes

1. **Soft Deletes:** Registrations are never hard-deleted; `status` is set to `'cancelled'` to preserve audit trail.

2. **Async Team Acceptance:** Team members don't need to accept before event can proceed. Team lead can proceed with confirmed/attended status even if members still pending.

3. **Duplicate Prevention:** Search function actively excludes already-registered users to prevent double registration.

4. **Role Filtering:** If event has eligibility requirements, search only returns users with required role.

5. **Array Storage:** `team_members` stored as UUID array in single row for performance. Individual tracking in separate table.

6. **Atomicity:** All team member rows inserted together; if any fail, whole registration fails.

7. **Revalidation:** Both individual and team paths call `revalidatePath()` to refresh UI after successful operations.
