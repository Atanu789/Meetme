# Pre-Deployment Verification Checklist

## ✅ Implementation Verification

### Phase 1: Code Review (5 minutes)

#### Created Files Present
- [ ] `app/api/recording/start/route.ts` exists
- [ ] `app/api/recording/stop/route.ts` exists
- [ ] `app/api/recording/status/route.ts` exists
- [ ] `app/api/livestream/start/route.ts` exists
- [ ] `app/api/livestream/stop/route.ts` exists
- [ ] `app/api/livestream/status/route.ts` exists
- [ ] `hooks/useRecording.ts` exists
- [ ] `hooks/useLivestream.ts` exists
- [ ] `components/YouTubeStreamModal.tsx` exists

#### Modified Files
- [ ] `components/Navbar.tsx` imports new hooks
- [ ] `components/Navbar.tsx` has recording button
- [ ] `components/Navbar.tsx` has livestream button
- [ ] `.env.example` has Jibri variables

### Phase 2: Build Verification (5 minutes)

#### Compilation
```bash
npm run build
```

- [ ] Build completes without errors
- [ ] No TypeScript compilation errors
- [ ] No missing import errors
- [ ] All types resolve correctly

#### Linting
```bash
npm run lint
```

- [ ] No ESLint errors found
- [ ] Code follows project style
- [ ] No React hook warnings

### Phase 3: Development Testing (10 minutes)

#### Setup Dev Environment
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Optional - Watch build
npm run build --watch
```

#### Test Recording Hook
```bash
# In browser console while in a room:
localStorage.setItem('DEBUG', 'jitsi:*')
// Access useRecording hook via devtools
```

- [ ] Hook initializes without errors
- [ ] State updates on actions
- [ ] API calls are made correctly

#### Test Recording Button
1. Navigate to a room on `http://localhost:3000/room/test-room`
2. Locate the navbar buttons

- [ ] ⏺ Record button is visible
- [ ] Button is clickable
- [ ] Button style is correct (light gray initially)

#### Test Livestream Button
1. In same room, locate livestream button

- [ ] 📺 YouTube button is visible
- [ ] Button is clickable
- [ ] Button style is correct (rose/pink color)

#### Test YouTube Modal
1. Click 📺 YouTube button
2. Modal should appear

- [ ] Modal opens without errors
- [ ] Modal backdrop visible
- [ ] Input field focusable
- [ ] Close button works
- [ ] Form validation works

### Phase 4: API Testing (15 minutes)

#### Test Recording API Endpoints

```bash
# Terminal 3: Test with curl or REST client

# 1. Test start endpoint
curl -X POST http://localhost:3000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room"}'

# Expected response (with valid Jibri service):
# {"success":true,"recordingId":"test-room-xxxxx","status":"recording"}

# Or expected response (without Jibri service):
# {"error":"Jibri service not configured","status":503}

# 2. Test start without auth (should fail)
curl -s http://localhost:3000/api/recording/start \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"roomName":"test-room"}' \
  -b "no-auth-cookie" | jq
# Should return: {"error":"Unauthorized","status":401}

# 3. Test without roomName (should fail)
curl -X POST http://localhost:3000/api/recording/start \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return: {"error":"roomName is required","status":400}
```

- [ ] API responds with proper status codes
- [ ] Authentication check works
- [ ] Input validation works
- [ ] Error messages are helpful

#### Test Livestream API Endpoints

```bash
# Test with YouTube URL validation
curl -X POST http://localhost:3000/api/livestream/start \
  -H "Content-Type: application/json" \
  -d '{
    "roomName":"test-room",
    "youtubeStreamUrl":"invalid-url"
  }'
# Should fail: invalid URL validation

curl -X POST http://localhost:3000/api/livestream/start \
  -H "Content-Type: application/json" \
  -d '{
    "roomName":"test-room",
    "youtubeStreamUrl":"rtmps://a.rtmp.youtube.com/live2/test"
  }'
# Should succeed if Jibri is configured
```

- [ ] URL validation prevents invalid URLs
- [ ] Valid rtmps:// URLs accepted
- [ ] Returns proper error/success responses

### Phase 5: Integration Testing (20 minutes)

#### Prerequisites Check
- [ ] Self-hosted Jitsi running (not meet.jit.si)
- [ ] Environment variables configured in `.env.local`
  - [ ] `NEXT_PUBLIC_JITSI_DOMAIN` set
  - [ ] `JIBRI_SERVICE_URL` set (or will fail gracefully)
  - [ ] `JIBRI_API_SECRET` set (or will fail gracefully)

#### Full UI Flow Test
1. Start server: `npm run dev`
2. Create/join meeting room
3. Verify buttons appear

- [ ] Recording button shows in navbar
- [ ] Livestream button shows in navbar
- [ ] Buttons are in correct location (after AI Assistant)
- [ ] Buttons have proper spacing

#### Recording Flow Test
1. Click ⏺ Record button
2. Observe state change

- [ ] Button changes to ⏹ Recording
- [ ] Button color changes to red
- [ ] Wait 2-3 seconds
- [ ] Stop recording by clicking button
- [ ] Button returns to ⏺ Record
- [ ] No error messages appear

#### Livestream Modal Flow Test
1. Click 📺 YouTube button
2. Modal appears

- [ ] Modal opens cleanly
- [ ] Placeholder text visible
- [ ] Input field is focused
- [ ] Can type in input

3. Try invalid URL
- [ ] Input "test"
- [ ] Click "Go Live"
- [ ] Error message appears

4. Try valid URL
- [ ] Clear input
- [ ] Paste: `rtmps://a.rtmp.youtube.com/live2/test-key`
- [ ] Click "Go Live"
- [ ] One of: Success (if Jibri running) or Jibri-error message

### Phase 6: Error Handling Verification (10 minutes)

#### Network Error Simulation

```javascript
// In browser console:
// Simulate network error by blocking API
// Can use DevTools Network tab to throttle/block requests
```

- [ ] Shows meaningful error message
- [ ] Error message has dismiss button
- [ ] Can dismiss and retry
- [ ] UI doesn't break on error

#### Invalid Configuration Test

```bash
# Test without JIBRI_API_SECRET set
# Temporarily remove from .env and restart
npm run dev
```

- [ ] API returns 503 "not configured"
- [ ] Frontend displays helpful error
- [ ] Doesn't crash application

#### API Unreachable Test

```bash
# Stop Jibri if running, or use wrong URL in JIBRI_SERVICE_URL
```

- [ ] Connection timeout handled gracefully
- [ ] Error message displayed
- [ ] User can retry without refresh

### Phase 7: Accessibility & UX (5 minutes)

#### Button Interactions
- [ ] Recording button has clear hover state
- [ ] Livestream button has clear hover state
- [ ] Buttons are clickable (cursor changes)
- [ ] Buttons have sufficient size (mobile-friendly)

#### Modal UX
- [ ] Modal is centered
- [ ] Modal has close button (X)
- [ ] Click backdrop closes modal
- [ ] Tab navigation works in form
- [ ] Form labels are visible

#### Error UX
- [ ] Error messages are visible
- [ ] Error messages use readable color
- [ ] Error messages have dismiss button
- [ ] Multiple errors don't stack

#### Loading States
- [ ] Button shows disabled state while loading
- [ ] Cannot click button multiple times
- [ ] Loading indicator helpful (text changes)

### Phase 8: Production Readiness (15 minutes)

#### Configuration
```bash
# Check production configuration
cat .env.local
```

- [ ] `NEXT_PUBLIC_JITSI_DOMAIN` is production domain
- [ ] `JIBRI_SERVICE_URL` is production URL
- [ ] `JIBRI_API_SECRET` is set to strong value
- [ ] No developer/test values remain

#### Security Audit
- [ ] All endpoints check authentication
- [ ] Sensitive values not logged
- [ ] Input validation on all endpoints
- [ ] Proper CORS headers (if needed)
- [ ] Rate limiting considered

#### Performance Check
```bash
# Build for production
npm run build

# Check bundle size
du -sh .next/
```

- [ ] Build completes without warnings
- [ ] Bundle size reasonable
- [ ] No console errors in production build

#### Documentation
- [ ] JIBRI_QUICK_START.md reviewed
- [ ] JIBRI_LIVESTREAM_SETUP.md reviewed
- [ ] IMPLEMENTATION_SUMMARY.md reviewed
- [ ] FILE_REFERENCE.md reviewed

#### Deployment
- [ ] Code committed to git
- [ ] All files tracked
- [ ] No .env secrets in git
- [ ] Deployment guide followed
- [ ] Monitoring configured

## ✅ Pre-Deployment Sign-Off

### Checklist Summary
- [ ] All 9 new/modified files present
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] UI renders correctly
- [ ] API endpoints respond correctly
- [ ] Error handling works
- [ ] Configuration complete
- [ ] Documentation reviewed
- [ ] Security verified
- [ ] Production ready

### Final Checks Before Merge/Deploy

1. **Code Quality**
   - [ ] TypeScript types complete
   - [ ] No console.log() left for debugging
   - [ ] No TODO/FIXME comments
   - [ ] Error messages user-friendly

2. **Testing**
   - [ ] Manual testing complete
   - [ ] Error scenarios tested
   - [ ] Mobile responsiveness tested
   - [ ] Different browsers tested

3. **Documentation**
   - [ ] README updated (if needed)
   - [ ] Inline comments sufficient
   - [ ] Setup guide complete
   - [ ] Troubleshooting guide complete

4. **Deployment**
   - [ ] All env vars documented
   - [ ] Deployment steps clear
   - [ ] Rollback plan identified
   - [ ] Team notified of changes

## 🚀 Deployment Sign-Off

**Date**: _______________

**Reviewed By**: _______________

**Status**:  ☐ Ready for Deployment  ☐ Hold for Fixes

**Notes**:
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

## 📋 Post-Deployment Verification

After deploying to production, verify:

```bash
# 1. Check API endpoints are accessible
curl https://your-domain.com/api/recording/status?roomName=test-check

# 2. Verify Jibri connectivity
# (Check your monitoring/logging system)

# 3. Test recording functionality
# Join meeting → Click record → Verify recording status

# 4. Test livestream functionality
# Join meeting → Click YouTube → Enter test URL → Verify stream starts

# 5. Monitor error logs
# Check for any errors in API calls
# Check Jibri service health
# Monitor recording file creation
```

- [ ] APIs responding
- [ ] Jibri service connected
- [ ] Recording functioning
- [ ] Livestream functioning
- [ ] No errors in logs
- [ ] Users can access features

## 🎉 Deployment Complete!

Once all items checked, the implementation is ready for users.

---

**Implementation Version**: 1.0
**Last Updated**: May 27, 2026
**Status**: ✅ Ready for Deployment
