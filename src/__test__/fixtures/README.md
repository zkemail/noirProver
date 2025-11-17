# Test Email Fixtures

This directory contains email fixtures for testing the Noir Prover endpoint.

## Available Fixtures

### x.eml
Real X (Twitter) password reset email with DKIM signature.
- Blueprint: `benceharomi/x_handle@v1`
- Status: ✅ Ready to use

### discord.eml
Placeholder Discord email.
- Blueprint: Update in `server.test.ts` line 96
- Status: ⚠️ Needs replacement with real email

## How to Add New Email Fixtures

1. **Get a real email with DKIM signature**
   - Most service emails (Google, Discord, Twitter, etc.) have DKIM signatures
   - Request a verification or notification email from the service

2. **Download the raw .eml file**
   - **Gmail**: Open email → Three dots menu → Download message
   - **Outlook**: Open email → File → Save As → .eml format
   - **Apple Mail**: Open email → File → Save As

3. **Add to fixtures**
   - Save the .eml file to this directory
   - Name it descriptively (e.g., `github-verification.eml`)

4. **Update the test**
   - Edit `src/__test__/server.test.ts`
   - Add a new test case with the blueprint slug
   - Add a new npm script in `package.json`

## Example: Adding GitHub Email Test

1. Save GitHub email as `github.eml`
2. Get the blueprint slug (e.g., `username/github_verify@v1`)
3. Add to `server.test.ts`:

```typescript
if (!testType || testType === "github") {
  await testProveEndpoint(
    "github.eml",
    "username/github_verify@v1",
    "GitHub Verification Email"
  );
}
```

4. Add to `package.json`:

```json
"test:github": "tsx src/__test__/server.test.ts github"
```

## Blueprint Information

Find blueprints at: https://dev-conductor.zk.email

Or create your own using the ZK Email SDK documentation.




