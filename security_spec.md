# Security Spec for News Portal

## 1. Data Invariants
- A news article must have a valid `authorId` matching the current user.
- Articles can only be seen by the public if `status` is 'published'.
- Admins can manage all articles and settings.
- Only admins can write to `settings/global`.

## 2. Dirty Dozen Payloads
- P1: Create article as unauthenticated user.
- P2: Update article `views` to a huge number from the client.
- P3: Change `authorId` of an article to someone else.
- P4: Inject 1MB string into article `title`.
- P5: Overwrite `settings/global` as a random user.
- P6: Access `draft` articles as a visitor.
- P7: Delete an article you didn't create (and not an admin).
- P8: Create an article with missing required fields.
- P9: Set `status` to an invalid value like 'deleted'.
- P10: Update `createdAt` after document creation.
- P11: Create a site setting with a 10MB `logoUrl` string.
- P12: Spoof admin status by writing to `admins` collection (should be denied).

## 3. Test Runner (Draft)
```typescript
// firestore.rules.test.ts
// Tests will verify rejection of payloads above.
```
