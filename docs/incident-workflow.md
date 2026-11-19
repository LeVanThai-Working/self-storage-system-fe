# Incident workflow verification

## Location validation

- Web reports require a deliberate choice of storage unit or common area. Rack/tier selection is optional detail within the chosen unit; the request identifies a rack incident when a rack is selected. Common areas require a trimmed 3–300 character location and cannot carry storage/contract IDs or storage relocation/maintenance flags. Customer mobile reports identify the selected contract's unit and optional rack.
- BE validates unit → facility, rack → unit/facility, tier → rack/unit/facility and linked contract → unit/rented rack before writes. Customer reports require their own contract. Staff rack reports inherit the rack's current contract when omitted by the client.
- Evacuation requires the incident's existing unit and rack; `fromRackId` cannot introduce or replace a rack. Common-area repairs are accepted and closed by a manager without customer acknowledgment.
- Old reports remain readable. Missing locations are labeled as unspecified; no location is guessed or migrated automatically. Existing API clients that supply unit/rack IDs remain compatible; location-free reports must use the explicit common-area scope. Deploy BE and FE together.

## Assignment during repairs

- Manager and ops lists have a dedicated Assign / Change assignee dialog; the same form is available on detail. Staff only sees the detail action.
- Android regression: switch Support → Incidents → Support repeatedly, filter and open detail. Segment backgrounds remain styled from the first render and the two lists have separate keys, avoiding NativeWind's runtime subtree upgrade (which threw a navigation-context error).
- An evacuated repair cannot be acknowledged until a manager uploads its signed handover document after resolution. Mobile states this prerequisite explicitly; the existing ticket's document is not fabricated or acknowledged during verification.

- Facility managers and business ops can assign or change staff while reported, assigned, investigating or in progress. Assigning a reported incident advances it to assigned; all other statuses are preserved, with an atomic check of the status read before assignment.
- Emergency evacuation remains available without an assignee. Detail always shows the assignee or an unassigned warning; the evacuation operator is shown separately.
- Business ops opens `/vi/business-ops/incidents`, selects an incident, and chooses active staff from that incident's facility. Assigned staff completes the resolution report with photos from the staff detail page.
- Regression: evacuate an unassigned report, assign from ops while in progress, then resolve as that assignee. Reject assignment by staff, across facilities, to a non-staff user, or after resolution/closure/cancellation.

## Delivered behavior

- Facility report form links unit, rack, tier and the rack's current contract. Common-area reports remain supported.
- Facility detail provides a pre-evacuation count form, evidence upload and a repair/relocation choice. Every actual count must be explicitly entered, including zero.
- Manager uploads one signed PDF/image (10 MB maximum) after repair, or during the relocation branch. Files cannot be replaced through this UI after customer acknowledgment.
- Customer views the count manifest and signed document, then acknowledges separately. An evacuated incident stays open until the manager closes it.
- Manager closure requires the paper document and acknowledgment for evacuated incidents. Relocation permits closure from `IN_PROGRESS`; repair requires `RESOLVED`.
- Non-evacuated incidents retain customer/manager closure from `RESOLVED`. Staff cannot close incidents or upload the signed handover document.
- Facility compensation is preserved in `damageFee`, rather than being overwritten with zero.
- Customer notifications open incident detail and invalidate cached incident data. Returning to detail refreshes the authoritative status.

## Returning evacuated goods to a rack

- Customer acknowledgment alone does not release holding goods. The incident must be closed with its signed handover document and customer acknowledgment. Damaged/disputed stock and a SKU shared with another open evacuation stay blocked.
- Closing a repair-in-place case reopens its maintenance rack as rented only while the same live contract still rents it and no other open case affects that rack. Relocation, reassigned racks and inactive racks are not reopened.
- Mobile shows the parent rack's maintenance/inactive state even if its tiers are available. Holding detail offers **Return to rack** per eligible SKU; the move form accepts a healthy rented destination, available quantity and reason. Ordinary moves cannot target holding.
- Old closed cases receive holding permissions without changing their stock. Legacy rack maintenance is not silently reset by reads. On the deployed BE, inspect with `npx tsx scripts/repair-closed-incident-racks.ts --contract-code=SEED-M5-Q2-08`; add `--apply` after reviewing the report. The script requires the intended `MONGODB_URI`, limits changes to that contract, records an audit and skips open cases, relocation or changes made after closure. It does not reset tier maintenance.

## Manual scenarios for a local test environment

Use customer, assigned staff and manager accounts from the same facility. Use a separate customer/facility for negative cases. Do not use production records for these checks.

1. **Repair in place:** report with photos; assign staff; record investigation; resolve with evidence/cost/liability; close as customer or manager. No evacuation manifest is required.
2. **Evacuate and repair:** investigate; count every rack item and upload evidence; select repair; evacuate. Verify inventory is in holding and rack is under maintenance. Resolve; upload signed document; acknowledge on mobile; verify status remains `RESOLVED`; close as manager.
3. **Relocation/termination:** evacuate with relocation selected. Open linked contract to handle that separate workflow. Upload signed document, acknowledge on mobile, then close directly from `IN_PROGRESS`.
4. **Staff report:** report against a rented rack. Verify the contract customer sees it in the incident list and gets the document notification. Another customer must not see the incident or acknowledge it.
5. **Guards:** missing/failed evidence upload, blank/negative/fractional counts, short reason, missing signed document, pending customer acknowledgment, repeated submissions, closed/cancelled incident, and wrong staff/customer/facility.
6. **Cancellation:** customer reporter can cancel only while `REPORTED`; manager can cancel while `REPORTED` or `ASSIGNED`, with a reason.
7. **Money:** resolve with facility liability and a positive damage amount; verify the amount survives the request and is recorded by BE upon closure.

## Automated checks

- `pnpm exec vitest run tests/incidents tests/access-schedules`
- `pnpm --filter web exec tsc --noEmit`
- `pnpm --filter mobile exec tsc --noEmit`
- ESLint on the modified incident, notification and uploader files.
- BE: `tests/selfManagedRackIncidentEnhancement.test.ts`, `tests/selfManagedRackAddendumAndSettlement.test.ts`, `tests/incidentContractDamageSync.test.ts` (MongoDB memory replica set).

## Integration limits

- The evacuation API identifies counts by `skuId`, not inventory position. The UI blocks a rack containing the same SKU at multiple active positions to avoid assigning an incorrect count to each position.
- A common-area incident with no linked unit cannot be evacuated. A staff report without a linked customer contract cannot be routed to a contract customer for acceptance.
- Contract addendums, termination, physical goods return and rack reactivation remain in their existing modules; incident screens do not simulate those operations.
- Existing incident financial audit is best-effort; this change does not introduce a durable outbox or change settlement rules.
- No database migration is required. Deploy the BE customer-list/notification corrections together with the FE update.
- Automated checks exercise state gates and API integration; production browser workflows and actual file uploads must be verified separately in the local/test environment.
