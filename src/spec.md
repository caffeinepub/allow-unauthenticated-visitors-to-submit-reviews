# Specification

## Summary
**Goal:** Make the Catalog page feel instant by fetching vehicles once and filtering locally, while serving vehicle images as lossless WebP with safe fallbacks.

**Planned changes:**
- Update `/catalog` to fetch the full vehicle list once on entry and apply brand/model/color filters entirely client-side without additional vehicle fetches.
- Ensure pagination/infinite-scroll operates on the filtered in-memory results, not on the unfiltered full list.
- Add an error + retry state for the initial catalog load that re-fetches the full vehicle list.
- Remove redundant catalog fetching used only to populate filter dropdowns by deriving available brands/models/colors from the already-loaded vehicle list (and keeping options correct when vehicle data changes after invalidation).
- Update shared image usage (at minimum catalog cards and the progressive image component) to request lossless WebP variants when supported, with automatic fallback to the original format if WebP is unsupported or fails to load.

**User-visible outcome:** Opening the catalog loads quickly and filters update instantly without reloading vehicles; vehicle images load in lossless WebP when possible and fall back seamlessly when not.
