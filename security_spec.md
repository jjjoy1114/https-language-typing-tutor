# Security Specification: Student Typing Tutor

## 1. Data Invariants
- Each user profile (`/users/{userId}`) can only be read, created, or updated by the authenticated user (`request.auth.uid == userId`).
- Users cannot forge or modify another student's typing records or custom presets.
- Typing records (`/users/{userId}/records/{recordId}`) belong strictly to `userId`. `record.userId` must equal `request.auth.uid`.
- Custom presets (`/users/{userId}/customPresets/{presetId}`) belong strictly to `userId`. `preset.userId` must equal `request.auth.uid`.
- Document IDs must conform to alphanumeric formatting and not exceed safe boundary lengths (`isValidId`).
- Unauthenticated users cannot read or write any user records or presets.

## 2. The Dirty Dozen Payloads (Negative Tests)
1. **Unauthenticated Read**: Attempting `get` on `/users/victim_123` without auth token -> PERMISSION_DENIED.
2. **Cross-User Profile Write**: Authenticated as `attacker_999`, attempting `set` on `/users/victim_123` -> PERMISSION_DENIED.
3. **Ghost Field Poisoning**: Inserting `{ userId, displayName, isAdmin: true, role: 'superadmin' }` -> PERMISSION_DENIED.
4. **Oversized String Attack (Denial of Wallet)**: Submitting a `textTitle` with 50,000 characters -> PERMISSION_DENIED.
5. **Cross-User Record Injection**: Authenticated as `attacker_999`, creating `/users/victim_123/records/rec_1` with `userId: 'victim_123'` -> PERMISSION_DENIED.
6. **Forged Author ID in Record**: Authenticated as `user_123`, creating `/users/user_123/records/rec_1` with `userId: 'admin_456'` -> PERMISSION_DENIED.
7. **Negative Stats Poisoning**: Submitting negative numbers for `wpm`, `cpm`, or `accuracy` -> PERMISSION_DENIED.
8. **Invalid Typing Mode**: Setting `mode: 'hacker_mode'` outside `['word', 'sentence', 'paragraph']` -> PERMISSION_DENIED.
9. **Record ID Poisoning**: Using path `/users/user_123/records/../malicious/path` or special characters -> PERMISSION_DENIED.
10. **Blanket Query Scraping**: Attempting to query records collectionGroup or list without matching user ID -> PERMISSION_DENIED.
11. **Custom Preset Size Overflow**: Uploading a preset with content exceeding 50,000 characters -> PERMISSION_DENIED.
12. **Immutable Field Tampering**: Modifying `createdAt` or `userId` in existing record during update -> PERMISSION_DENIED.
