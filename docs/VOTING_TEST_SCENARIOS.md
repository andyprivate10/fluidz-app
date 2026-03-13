# E2E Test Scenarios: Consultative Voting (3+ Members)

## Test Setup

### Prerequisites
Before running tests, you need these test accounts in Supabase Auth:
- `host@fluidz.test` - Marcus (Host)
- `member@fluidz.test` - Karim (Member)
- `guest@fluidz.test` - Yann (Member)
- `candidate@fluidz.test` - Alex (Pending candidate)

All with password: `testpass123`

### Test Data Setup
1. Open DevTestMenu (`/dev`)
2. Click "Clear Test Data" to clean up
3. Click "Seed Test Data" to create test scenario
4. This creates:
   - Session "Plan ce soir 🔥" with Marcus as host
   - Karim and Yann as accepted members (3+ total including host)
   - Alex as pending candidate for voting

## Test Scenarios

### 1. Vote Visibility Test
**Objective**: Verify votes only appear with 3+ accepted members

**Steps**:
1. Log out and log in as `member@fluidz.test` (Karim)
2. Navigate to session page
3. **Expected**: Vote cards should be visible (3+ members: Marcus, Karim, Yann)
4. **Check**: "VOTE CONSULTATIF" section appears
5. **Check**: Alex's candidate card shows with vote buttons

### 2. Member Voting Test
**Objective**: Test voting functionality from member perspective

**Steps**:
1. As Karim, vote "Oui" on Alex's candidature
2. **Expected**: Vote button becomes selected/disabled
3. **Expected**: Vote count shows "1 oui · 0 non"
4. **Expected**: Cannot vote again (buttons disabled)

### 3. Cross-Member Vote Visibility Test
**Objective**: Verify votes are visible to all members

**Steps**:
1. Log out and log in as `guest@fluidz.test` (Yann)
2. Navigate to same session page
3. **Expected**: See Karim's vote count "1 oui · 0 non"
4. Vote "Non" on Alex's candidature
5. **Expected**: Vote count updates to "1 oui · 1 non"

### 4. Host Dashboard Vote Summary Test
**Objective**: Verify host can see detailed vote breakdown

**Steps**:
1. Log out and log in as `host@fluidz.test` (Marcus)
2. Navigate to session page → "Gérer la session"
3. Go to "En attente" tab
4. **Expected**: Alex's card shows vote summary:
   - "📊 Votes des membres (2)"
   - "👍 1 oui" and "👎 1 non"
   - Individual voter details: "Karim: 👍" and "Yann: 👎"

### 5. Double Vote Prevention Test
**Objective**: Ensure no crashes on multiple vote attempts

**Steps**:
1. As any voting member, try to vote again on same candidate
2. **Expected**: No effect, no crash, vote remains unchanged
3. **Expected**: Buttons remain disabled after first vote

### 6. Host Final Decision Test
**Objective**: Verify consultative nature - host decides

**Steps**:
1. As host (Marcus), in HostDashboard
2. Despite vote results, host can still "Accepter" or "Refuser"
3. **Expected**: Host decision overrides member votes
4. **Expected**: Disclaimer shows "Vote consultatif : visible par tous les membres. Le host tranche la décision finale."

## Verification Checklist

- [ ] ✅ Votes visible uniquement si 3+ membres acceptés
- [ ] ✅ Chaque membre vote une fois par candidat  
- [ ] ✅ Vote consultatif (affiché mais host décide)
- [ ] ✅ Pas de crash si on vote 2 fois
- [ ] ✅ Host voit le résumé des votes dans HostDashboard

## Technical Implementation Notes

### Key Features Implemented:
1. **Vote visibility condition**: `members.length >= 3` in SessionPage.tsx:379
2. **Double vote prevention**: Uses `myVote` check + database UNIQUE constraint
3. **Vote storage**: `votes` table with proper RLS policies
4. **Host dashboard integration**: Vote summary with individual voter details
5. **Consultative disclaimer**: Clear messaging about host final authority

### Database Schema:
```sql
CREATE TABLE votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES sessions(id),
  application_id uuid REFERENCES applications(id),
  voter_id uuid REFERENCES user_profiles(id),
  vote text CHECK (vote IN ('yes', 'no')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, voter_id) -- Prevents double voting
);
```

### Security Considerations:
- RLS policies ensure members can only vote as themselves
- UNIQUE constraint prevents database-level double voting
- Frontend prevents UI-level double voting
- Host maintains final decision authority

## Test Accounts Quick Reference

| Role | Email | Display Name | Status |
|------|-------|--------------|---------|
| Host | host@fluidz.test | Marcus | Host |
| Member | member@fluidz.test | Karim | Accepted |
| Member | guest@fluidz.test | Yann | Accepted |
| Candidate | candidate@fluidz.test | Alex | Pending |

Password for all: `testpass123`