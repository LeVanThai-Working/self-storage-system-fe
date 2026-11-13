# Access Schedule frontend update

Implemented against the supplied backend contract in the existing screens.

## Updated behavior

- Shared contracts use six-digit OTP in `code`, assignment fields on detail/list, `assignmentScope`, claim/assign/unassign endpoints, notification type `access_schedule`, and errors 659–662.
- Mobile customer detail uses the latest API response for OTP. There is no separate OTP store, QR display, fallback to an old OTP, code generation, or automatic reissue. OTP is hidden during refresh, when unavailable, and after check-in.
- Mobile list/detail show responsible staff or an explicit unassigned state. Removing an assignment does not locally cancel the appointment.
- Mobile receives foreground Socket.IO events `notification:new` and `notification:unread_count`. It refreshes server data after assignment notifications, reconnects on foreground, and opens the appointment from `metadata.accessScheduleId` when a notification is tapped. It does not implement background push notifications.
- Staff web supports assignment filters and claiming unassigned pending visits. OTP check-in makes a single check-in request; it does not call claim first. Only the responsible staff sees checkout for a checked-in visit.
- Manager assigns an unassigned pending visit or removes its assignment with a required reason. Both requests use the current response's `assignmentVersion`. Changing staff requires removal followed by assignment. No assignment changes or manager check-in/checkout controls are offered after check-in.
- Assignment mutation failures refresh server data. No version is incremented or guessed, and no mutation is automatically retried after error 660.
- The backend decides check-in timing and staff workload. The frontend does not block these requests using a hardcoded time window. Existing customer cancellation deadlines are retained and interpreted in Vietnam time.
- VI/EN copy was updated using the supplied error meanings. QR features in other modules were not changed.

## Files changed in this task

Shared:

- `packages/shared/src/types/accessSchedule.types.ts`
- `packages/shared/src/schemas/request/accessSchedule.request.schema.ts`
- `packages/shared/src/schemas/index.ts`
- `packages/shared/src/constants/accessSchedule.constant.ts`
- `packages/shared/src/constants/messageCode.ts`
- `packages/shared/src/enums/notification.enum.ts`
- `packages/shared/src/utils/accessSchedule.util.ts` (new)
- `packages/shared/src/utils/index.ts`

Mobile:

- `apps/mobile/app/access-schedules/[id].tsx`
- `apps/mobile/app/_layout.tsx`
- `apps/mobile/features/access-schedules/api/accessSchedule.api.ts`
- `apps/mobile/features/access-schedules/hooks/useAccessSchedules.ts`
- `apps/mobile/features/access-schedules/components/AccessScheduleCard.tsx`
- `apps/mobile/features/access-schedules/utils/accessScheduleFormat.ts`
- `apps/mobile/features/access-schedules/stores/accessOtp.store.ts` (removed)
- `apps/mobile/features/notifications/components/NotificationModal.tsx`
- `apps/mobile/features/notifications/hooks/useNotificationRealtime.ts` (new)
- `apps/mobile/locales/en.json`
- `apps/mobile/locales/vi.json`
- `apps/mobile/package.json` (`socket.io-client` dependency)

Web:

- `apps/web/features/access-schedules/api.ts`
- `apps/web/features/access-schedules/hooks.ts`
- `apps/web/features/access-schedules/components/AccessScheduleListView.tsx`
- `apps/web/features/access-schedules/components/AccessScheduleDetailView.tsx`
- `apps/web/features/access-schedules/components/GateCheckInPanel.tsx`
- `apps/web/features/access-schedules/components/AccessScheduleAssignmentActions.tsx` (new)
- `apps/web/messages/en.json`
- `apps/web/messages/vi.json`

Verification/tooling:

- `tests/access-schedules/contract.test.ts` (new)
- `tests/access-schedules/api.test.ts` (new)
- `vitest.config.mts` (new)
- `package.json` (`test:access-schedules` command and Vitest dependency)
- `pnpm-lock.yaml`
- `docs/ACCESS_SCHEDULE_FE_UPDATE.md` (this report)

Other uncommitted changes already present in the workspace were retained.

## Verification

- `pnpm run test:access-schedules`: 45 tests passed. Covers OTP lifecycle, roles/ownership/status, schemas, exact assignment versions, notification target IDs, Vietnam dates, and mocked API request/response handling.
- `pnpm exec tsc --noEmit`: passed in shared, mobile and web (web also checked by production build).
- Scoped ESLint: passed for modified web/mobile Access Schedule and notification files.
- `pnpm exec next build`: passed, including staff/manager Access Schedule routes.
- `pnpm exec expo export --platform android --output-dir dist/access-schedule-check`: passed. Output is local and ignored by Git; this is bundle verification, not an installed-device test.
- Search confirmed no `qrPayload`, QR renderer or OTP-only-once store remains in Access Schedule.

No new UI location or unspecified workflow was needed, so no additional UI clarification is pending. Buttons/dialogs use the existing list/detail and notification surfaces.

Live end-to-end verification with authenticated customer/staff/manager sessions, a deployed backend and actual Socket.IO delivery has not been performed. Nothing was deployed and no business data was changed.
