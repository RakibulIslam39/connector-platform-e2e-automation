# Debugging Strategy

---

## Playwright Debug Tools

### Debug Mode (step-by-step)
```bash
npx playwright test --debug
# Opens Playwright Inspector — step through actions, inspect locators
```

### UI Mode (interactive test runner)
```bash
npm run test:ui
# Visual test browser, timeline, locator picker
```

### Headed Mode (see the browser)
```bash
npm run test:headed
# Runs tests visibly with real browser
```

### Traces
```bash
# Open a trace file
npx playwright show-trace test-results/trace.zip
```

### Slow Motion
```javascript
// In playwright.config.js use block
use: { launchOptions: { slowMo: 500 } }
// Or via env: SLOW_MO=500
```

---

## Common Test Failures and Fixes

### Timeout: Element not found
```
TimeoutError: Locator.click: Timeout 15000ms exceeded
```
**Debug steps:**
1. Run `--debug` and see what's on the page
2. Check if selector is wrong — use Playwright Inspector
3. Check if element is inside an iframe
4. Check if page load is delayed
5. Try `await page.screenshot({ path: 'debug.png', fullPage: true })`

### Auth Failure
```
Error: Expected URL to match /wp-admin/
```
**Debug steps:**
1. Check `.env.local` credentials
2. Delete `auth-state/*.json` and re-run (forces fresh auth)
3. Try logging in manually to confirm credentials work

### Element in wrong state
```
Error: locator.fill: Element is not an <input>, <textarea> or [contenteditable]
```
**Fix:** Check selector — may be targeting wrong element or parent

### Flaky test — passes sometimes
**Strategies:**
1. Replace `waitForTimeout(n)` with explicit `waitFor()` or `expect().toBeVisible()`
2. Add `await page.waitForLoadState('networkidle')` after navigation
3. Use `retryAction()` from retry-handler for known-flaky interactions
4. Check for race conditions in API responses

---

## Logging
```javascript
const logger = require('../../common/utils/logger');
logger.debug('Detailed step info');
logger.info('Important action');
logger.warn('Non-critical issue');
logger.error('Test-breaking error', err);
```
Log files: `logs/test-run.log`, `logs/errors.log`

---

## API Debugging
```javascript
// Check raw API response
const response = await request.get(url, { headers });
console.log('Status:', response.status());
console.log('Body:', await response.text());
```

## Screenshots for Debugging
```javascript
await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
```

## Checking Network Requests
```javascript
page.on('request', req => console.log('Request:', req.url()));
page.on('response', res => console.log('Response:', res.url(), res.status()));
```

## External Order Debugging (Hub)
- Use Hub Manual Placement payload/response debug section
- Payload shows what was sent to WRH/Wiks
- Response shows what the fulfillment shop returned
- No need to directly access partner site for debugging
