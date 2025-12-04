# DegreeSign Server Analytics SDK - Private, simple, essential analytics

## Setup
Install using `yarn add @degreesign/analytics` or `npm install @degreesign/analytics` 

OR use in browsers through CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@degreesign/analytics@0.0.8/dist/browser/degreesign.min.js"></script>
```

```typescript
    const 
        /** IPs list */
		ipList = ipReset(),
		/** IP current country range */
		ipRange = await ipCountryDataUpdate();

    // Check if IP is beyond limit
    ipCheck(requestIPString, ipList);

    // White list an ip
    ipWhiteList(requestIPString, ipList);

    // Mark IP as paid for higher limits
    ipPaidList(requestIPString, ipList);

    // IP country code
    ipCountryCode(requestIPString, ipRange);
```

## Development In Progress...