# DegreeSign Server Analytics SDK - Private, simple, essential analytics

## Setup
Install using `yarn add @degreesign/analytics` or `npm install @degreesign/analytics` 
OR integrate in browser using CDN

## Server Implementation (Storage)
```typescript
import {
    startAnalytics,
    ipCheck,
    compare24hr,
    dateStandard,
    compareStats,
} from '@degreesign/analytics';

// Start Service
await startAnalytics({
    // optional config: ServiceConfig
});

// Check IP against limit
ipCheck(requestIPString);

// 24 hours Stats
const stats24hours = compare24hr();
console.log(`stats24hours`, stats24hours);

// Range Stats
const statsRange = compareStats({
    startDay: dateStandard(/** time / date */),
    endDay: dateStandard(/** time / date */),
});
console.log(`statsRange`, statsRange);
```

## Browser Nodejs Implementation (Submission)
```typescript
import {
    setWebConfig,
    webAnalytics,
} from '@degreesign/analytics';

// Set Check Interval
setWebConfig({
    checkInterval: 5e3 // 5 Seconds
});

// Web Page Analytics
webAnalytics({
    logged: false,
    record: (data: PageVisitPayload) => {
        // Send `data` to server
        console.log(`webAnalytics`, data);
    },
});
```

## Browser CDN Implementation (Submission)
```html
<script 
    src="https://cdn.jsdelivr.net/npm/@degreesign/analytics@1.0.4/dist/browser/degreesign.min.js"
></script>

<script>
// Set Check Interval
dsAnalytics.setWebConfig({
    checkInterval: 5e3 // 5 Seconds
});

// Web Page Analytics
dsAnalytics.webAnalytics({
    logged: false,
    record: data => {
        // Send `data` to server
        console.log(`webAnalytics`, data);
    },
});
</script>
```