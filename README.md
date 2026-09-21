# @degreesign/analytics

**Privacy-first, self-hosted web analytics for Node.js and the browser** — capture pageviews, clicks and in-view events, resolve visitor countries from IP ranges, and generate traffic reports without cookies, third-party trackers, or an external analytics service.

[![npm version](https://img.shields.io/npm/v/@degreesign/analytics.svg)](https://www.npmjs.com/package/@degreesign/analytics)
[![npm downloads](https://img.shields.io/npm/dm/@degreesign/analytics.svg)](https://www.npmjs.com/package/@degreesign/analytics)
[![license](https://img.shields.io/npm/l/@degreesign/analytics.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Browser](https://img.shields.io/badge/browser-UMD%20bundle-blue.svg)](https://cdn.jsdelivr.net/npm/@degreesign/analytics/)

## Table of Contents

- [Introduction](#introduction)
- [Why DegreeSign Analytics](#why-degreesign-analytics)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [IP Management and Rate Limiting](#ip-management-and-rate-limiting)
  - [Server-Side Analytics](#server-side-analytics)
  - [Traffic Analysis](#traffic-analysis)
  - [Browser Tracking](#browser-tracking)
  - [TypeScript Types](#typescript-types)
- [FAQ](#faq)
- [Keywords](#keywords)
- [License](#license)

## Introduction

`@degreesign/analytics` is a lightweight, TypeScript-first analytics SDK that gives you ownership of your own traffic data. The **browser** bundle records pageviews, click and in-view interaction events, then hands each payload to your `record` callback so you can send it to your own endpoint. The **Node.js** bundle receives those payloads, rate-limits abusive IPs, resolves each visitor's country from an IPv4 range database, and stores everything as plain JSON files on your server. From there it aggregates visits, unique visitors, bounce rate, durations, referrers, countries, devices, time-series charts and per-tag click/in-view metrics — no cookies, no third-party service, no data leaving your infrastructure.

## Why DegreeSign Analytics

- **Privacy-first and self-hosted** — every visit is stored on your own server; nothing is sent to a third party.
- **Cookie-free tracking** — visitors are identified by a random, rotating `statsId` in `localStorage`, not a tracking cookie.
- **Works in Node.js and the browser** — one package ships a CommonJS Node 18+ build and a UMD browser build.
- **TypeScript-native** — written in TypeScript with complete type declarations, enums and typed callback inputs.
- **Built-in spam protection** — IP rate limits, black/white/priority lists, and statistical visit-spam filtering.
- **Rich metrics out of the box** — visits, visitors, bounce, mean duration, referrers, countries, devices, screen dimensions, charts, and click/in-view tags.
- **Tiny dependency footprint** — only two small internal `@degreesign` helpers, no third-party runtime libraries.
- **Framework agnostic** — drop it into React, Vue, Svelte, Angular, Solid, or plain HTML/JS.
- **Zero-config defaults** — sensible intervals, rate limits and folder layout work immediately; every option is overridable.

## Installation

Install with your package manager:

```bash
# npm
npm install @degreesign/analytics

# yarn
yarn add @degreesign/analytics

# pnpm
pnpm add @degreesign/analytics
```

Or load the browser build straight from a CDN (UMD global: `dsAnalytics`):

```html
<script src="https://cdn.jsdelivr.net/npm/@degreesign/analytics@1.1.5/dist/browser/degreesign.min.js"></script>
```

## Quick Start

### 1. Track visits in the browser

```ts
import {
    setWebConfig,
    webAnalytics,
    recordEvent,
    StatsEventType,
} from '@degreesign/analytics';

// Optional: how often a running visit is reported (default 5000 ms)
setWebConfig({ checkInterval: 5e3 });

// Start the page-visit heartbeat.
// `record` fires periodically, and once more with `final === true` on dismissal.
webAnalytics({
    logged: false,
    record: (data, final) => {
        const body = JSON.stringify(data);
        if (final && navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics', body); // dismissal send
        } else {
            fetch('/api/analytics', { method: 'POST', body, keepalive: true });
        }
    },
});

// Tag a specific interaction (tag is required for click / inview)
recordEvent({ eventType: StatsEventType.click, tag: 'signup-cta' });
recordEvent({ eventType: StatsEventType.inview, tag: 'pricing-table' });
```

### 2. Receive and store visits on the server

```ts
import {
    startAnalyticsServer,
    ipCheck,
    recordStats,
    ipData,
} from '@degreesign/analytics';

// Configure storage and start IP + persistence services once at boot.
await startAnalyticsServer({
    trafficDir: 'traffic',
    thisDomain: 'example.com',
    searchEngines: ['google', 'bing'],
    excludeURIs: ['admin', 'health'],
});

// Inside your POST /api/analytics handler:
const requestIP = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

if (ipCheck(requestIP)) {
    recordStats({
        ipRange: ipData.ipRange,
        ips: requestIP,
        data: req.body, // the PageVisitPayload sent by the browser
    });
}
```

### 3. Read traffic reports

```ts
import {
    compare24hr,
    compareStats,
    dateStandard,
} from '@degreesign/analytics';

// Last 24 hours vs. the previous 24 hours
const [today, yesterday] = compare24hr() || [];
console.log(today?.visitors, today?.pages);

// A date range vs. the immediately preceding period
const [thisPeriod, previousPeriod] = compareStats({
    startDay: dateStandard('2026-01-01'),
    endDay: dateStandard('2026-01-31'),
}) || [];
console.log(thisPeriod?.total, thisPeriod?.countries, thisPeriod?.clicks);
```

### 4. CDN version (no bundler)

```html
<script src="https://cdn.jsdelivr.net/npm/@degreesign/analytics@1.1.5/dist/browser/degreesign.min.js"></script>
<script>
    dsAnalytics.setWebConfig({ checkInterval: 5e3 });

    dsAnalytics.webAnalytics({
        logged: false,
        record: (data, final) => {
            const body = JSON.stringify(data);
            if (final && navigator.sendBeacon) {
                navigator.sendBeacon('/api/analytics', body);
            } else {
                fetch('/api/analytics', { method: 'POST', body, keepalive: true });
            }
        },
    });
</script>
```

## API Reference

### IP Management and Rate Limiting

Rate-limit and geolocate visitors by IP address. Default thresholds are `generalAccess: 100`, `whiteListed: 500` and `priorityAccess: 3000`.

| Export | Signature | Description |
| --- | --- | --- |
| `ipCheck` | `(ips: string) => 1 \| 0 \| undefined` | Validate a raw IP string against the black, general, white and priority lists. Returns `1` when allowed and `0` when blocked (and blacklisted). |
| `ipWhiteList` | `(ips: string) => void` | Add one or more IPs to the trusted white list. |
| `ipPriorityList` | `(ips: string) => void` | Add one or more IPs to the high-rate-limit priority list. |
| `ipResetLimits` | `() => IPList` | Return a fresh, empty IP list structure with zeroed counters. |
| `ipRateLimits` | `RateLimits` | The active rate-limit thresholds object. |
| `ipRangeUpdate` | `() => Promise<void>` | Download the IPv4 → country range database and persist it to `ip_range.json`. |
| `ipNumericalValue` | `(ip: string) => number` | Convert a dotted IPv4 address to its numeric value. |
| `ipArray` | `(ips: string) => string[]` | Parse a comma-separated or `::ffff:`-prefixed IP string into an array. |
| `ipCountryCode` | `({ code, ips, ipRange }) => CountryCode` | Resolve the ISO country code for an IP, falling back to the supplied code or `UN`. |
| `ipData` | `IPData` | Live store holding the current `ipList` and `ipRange` arrays. |
| `ipStart` | `(config: IPConfig) => Promise<void>` | Load cached IP ranges, then schedule background range refresh and limit resets. |

### Server-Side Analytics

Call these from your Node.js backend to bootstrap the service, record incoming visits and persist them to disk.

| Export | Signature | Description |
| --- | --- | --- |
| `startAnalyticsServer` | `(config: ServiceConfig) => Promise<void>` | One-call bootstrap: start the IP service, apply the stats config and start persistence. |
| `configStats` | `(config: StatsConfig) => void` | Configure `trafficDir`, `thisDomain`, `excludeURIs`, `searchEngines` and `uriAlias`. |
| `recordStats` | `({ ipRange, ips, data }) => void` | Store a `PageVisitPayload` under today's bucket; merges duration updates for the same session. |
| `startStats` | `() => void` | Create the traffic folder and flush cached stats to disk every 15 seconds. |
| `dateStandard` | `(date) => string` | Normalize a `Date`, timestamp or date string to the `YYYY-MM-DD` bucket key. |

### Traffic Analysis

Aggregate raw stored visits into reports, charts and per-tag interaction metrics.

| Export | Signature | Description |
| --- | --- | --- |
| `compare24hr` | `(includeRaw?: boolean) => (StatsAnalysisResult \| undefined)[] \| undefined` | Analyze the last 24 hours against the previous 24 hours (returns `[today, yesterday]`). |
| `compareStats` | `({ startDay, endDay?, includeRaw? }) => (StatsAnalysisResult \| undefined)[] \| undefined` | Analyze a date range against the immediately preceding period. |
| `analyseStats` | `(params: StatsReqParams) => StatsAnalysisResult \| undefined` | Low-level analyzer turning raw day data into totals, pages, countries, devices, referrers, charts and click/in-view metrics. |
| `combineStats` | `(days: string[]) => TrafficDataDay` | Merge several stored days of traffic into a single dataset. |
| `compareDateStrings` | `({ startDay, endDay? }) => string[] \| undefined` | Build the current and previous period date buckets used by the comparators. |
| `statsPeriodStr` | `({ days, endTime? }) => { thisPeriod, prvPeriod }` | Generate comma-separated day lists for a period and its predecessor. |
| `statsAddOne` | `({ typeName, visitsObj, visitorsObj, visitId }) => void` | Increment visit and unique-visitor counts for one dimension value. |
| `formatVisits` | `({ visitors, visits }) => VisitorVisitsType[]` | Convert visitor/visit maps into `[value, visitors, visits]` tuples sorted by visitors. |

### Browser Tracking

Exported from the browser/UMD bundle and the package entry point. Also available on the CDN global `dsAnalytics`.

| Export | Signature | Description |
| --- | --- | --- |
| `webAnalytics` | `({ logged, record }) => void` | Start the page-visit heartbeat; calls `record(data, final?)` on each interval and on dismissal. |
| `setWebConfig` | `(config: WebConfig) => void` | Set the browser check interval (default `5000` ms). |
| `recordEvent` | `(input: RecordEventPageViewInput \| RecordEventInteractionInput) => PageVisitPayload` | Build a payload for a `pageview`, `click` or `inview` event. `tag` is required for interactions. |
| `webData` | `(logged?: boolean) => PageVisitPayload` | **Deprecated** — build a pageview payload directly; use `recordEvent` instead. |
| `getCountryCode` | `() => CountryCode` | Derive an approximate country code from the browser language. |

### TypeScript Types

All public types are exported and shipped as declaration files.

| Type | Description |
| --- | --- |
| `ServiceConfig` | Combined server configuration (`IPConfig & StatsConfig`). |
| `StatsConfig` | Stats storage options: `trafficDir`, `thisDomain`, `excludeURIs`, `searchEngines`, `uriAlias`. |
| `IPConfig` | IP service intervals: `ipRangeRefreshInterval`, `ipLimitResetInterval`. |
| `WebConfig` | Browser options: `checkInterval`. |
| `RecordCallback` | `(data: PageVisitPayload, final?: boolean) => any` — the browser record callback. |
| `PageVisitPayload` | Full visit record plus `uri`, as sent by the browser. |
| `PageVisitRecord` | Stored visit record (statsId, event, window size, referrer, duration, country, tag). |
| `PageVisitInitiation` | Local visit basics (session, timestamp, uri, logged). |
| `StatsAnalysisResult` | Full analysis output: totals, pages, countries, devices, charts, clicks, inviews and optional raw data. |
| `StatsReqParams` | Input accepted by `analyseStats`. |
| `StatsEventType` | Enum of tracked events: `pageview`, `click`, `inview`. |
| `StatsDevice` | Enum of device types: `mobile`, `desktop`. |
| `StatsDeviceType` | Union of the `StatsDevice` keys. |
| `StatsDeviceObj<T>` | Object keyed by every `StatsDevice`. |
| `RecordEventPageViewInput` | `recordEvent` input for a pageview. |
| `RecordEventInteractionInput` | `recordEvent` input for a click/inview (requires `tag`). |
| `StatsTagMetricSet` | Aggregated metrics for a single interaction tag. |
| `StatsTagMetricSets` | Interaction metrics grouped by tag. |
| `VisitorVisitsType` | `[value, visitors, visits]` tuple. |
| `DeviceWidthHeight` | `[width, height]` tuple. |
| `PageDeviceDimensions` | Per-page device dimension map. |
| `TrafficData` / `TrafficDataDay` | Stored traffic keyed by date, then by page URI. |
| `PageTrafficData` / `PageTrafficDataObj` | Per-page traffic metrics and their map. |
| `PageTrafficDataFinal` / `PageTrafficDataObjFinal` | Finalized per-page metrics including `durMean` and `verifiedVisits`. |
| `StatsFreqVisitors` / `StatsFreqVisits` | Frequent-visitor summaries and raw inputs. |
| `CountryCode` | ISO country code union. |
| `IPList` | IP list structure (`p`, `w`, `b`, `l`). |
| `IPData` | IP store: `ipList` and `ipRange`. |
| `IPRange` | `[startNum, endNum, countryCode]` tuple. |
| `IPCountryRange` | Raw start/end/country record from the range database. |
| `RateLimits` | Rate-limit thresholds: `generalAccess`, `whiteListed`, `priorityAccess`. |

## FAQ

**What is `@degreesign/analytics`?**
It is a privacy-first, self-hosted web analytics SDK. The browser bundle records visits and interaction events, and the Node.js bundle receives, rate-limits, geolocates, stores and analyzes them on your own server.

**Is it free?**
Yes. It is released under the MIT License and free to use in personal and commercial projects.

**Does it work in Node.js and the browser?**
Yes. The package ships two builds: a CommonJS bundle targeting Node.js 18+ (`dist/node`) and a UMD browser bundle (`dist/browser`) that exposes the global `dsAnalytics`.

**Does it have any dependencies?**
Only two small internal helpers, `@degreesign/cache` for JSON persistence and `@degreesign/utils` for shared utilities. There are no third-party runtime libraries.

**Is it written in TypeScript?**
Yes. The entire SDK is authored in TypeScript and ships `.d.ts` declarations for every public export, including enums and typed callback inputs.

**Which frameworks does it support?**
It is framework agnostic. Because it is plain JavaScript/TypeScript, it works with React, Vue, Svelte, Angular, Solid, or vanilla HTML. Browser features require `navigator`, `localStorage` and `document`; server features require a Node.js 18+ runtime with `fetch`.

**Does it use cookies?**
No. Visitors are identified by a random `statsId` kept in `localStorage` and rotated over time — there are no tracking cookies.

**Where is my data stored?**
On your own server. Visit records are written as JSON files under the configurable `trafficDir` (default `traffic`), and the IP-to-country range database is cached as `ip_range.json`.

## Keywords

web analytics, privacy-first analytics, self-hosted analytics, cookieless analytics, cookie-free tracking, pageview tracking, click tracking, in-view tracking, traffic analysis, visitor analytics, IP geolocation, IP rate limiting, spam filtering, Node.js analytics, browser analytics, TypeScript analytics SDK, UMD bundle, React analytics, Vue analytics, framework agnostic

## License

[MIT](./LICENSE) © DegreeSign
