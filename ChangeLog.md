# ChangeLog

## 1.1.2

- `StatsDevice` and `StatsEventType` now exported from the browser bundle.

## 1.1.1

- Removed the `durArray` field from `PageTrafficData` and `PageTrafficDataFinal`.

## 1.1.0

- `StatsEventType` converted to an enum and gained an `inview` member; now exported.
- New exported types `StatsTagMetricSet` and `StatsTagMetricSets`.
- `tag` field added to `PageVisitRecord` and `PageVisitPayload`.
- `StatsAnalysisResult` now returns per-tag `clicks` and `inviews` metrics.
- New exported `recordEvent` helper to submit tagged `click` / `inview` events.
- New exported `RecordEventPageViewInput` and `RecordEventInteractionInput` types; `recordEvent` now requires `tag` for `click` / `inview` events.
