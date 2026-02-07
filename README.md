# DegreeSign Server Analytics SDK - Private, simple, essential analytics

## Setup
Install using `yarn add @degreesign/analytics` or `npm install @degreesign/analytics` 

```typescript
import {
    startAnalytics,
    ipCheck,
    compare24hr,
    dateStandard,
} from '@degreesign/analytics';

// Start Service
await startAnalytics({
    // optional config: ServiceConfig
});

// Check IP against limit
ipCheck(requestIPString);

// 24 hours Stats
const stats24hours = compare24hr();

// Range Stats
const statsRange = compareStats({
    startDay: dateStandard(/** time / date */),
    endDay: dateStandard(/** time / date */),
});
```