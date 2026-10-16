# Implementation and verification notes

## Intended behavior

The installed app is an offline hydration reminder. Setup is occasional; reminder delivery must not require reopening a web page each day. Workdays are chosen by the user, rather than inferred from statutory holiday calendars. The supplied visual design and sound synthesis are retained. Pause is explicitly persistent until resumed.

## Scheduling

`src/native/plan.ts` compiles each selected time slot into a repeating daily/weekly `UNCalendarNotificationTrigger`, or a date-specific nonrepeating trigger. End times are exclusive. Earlier end times mean the following day; equal start/end times are invalid. Breaks are subtracted as intervals; spacing restarts at the end of a break. After-midnight work slots belong to the following calendar weekday while retaining the originally selected shift day.

Dates are local calendar dates, not UTC `toISOString()` values. Invalid dates, empty selections and expired one-off schedules are rejected. JS fixed dates and foreground next-occurrence estimates skip nonexistent local times during a DST spring-forward gap. Recurring triggers are ultimately matched by iOS; system-calendar, timezone-travel and DST behavior require device validation. Changes to the device's calendar/timezone are not handled through an always-running background process.

At most 62 distinct schedule requests are accepted, reserving capacity for one test and one snooze under the platform's 64-request limit. Dense plans fail before replacement; they are not silently truncated or kept alive through an unreliable rolling queue. Daily and weekly repeating requests continue beyond their first firing.

`native/ReminderScheduler.swift` serializes mutations and status snapshots across async notification-center calls. A replacement captures prior owned requests, removes them, adds the new rules and reads pending IDs back. If installation fails, it attempts to restore prior requests and reports failure, including incomplete restoration. The persisted plan changes only after successful installation. This is an application-level transaction, not crash-atomic: process termination during replacement may leave an incomplete queue; the next foreground status check reports unhealthy pending rules and asks the user to resave. It does not promise automatic repair while terminated.

Foreground refreshes carry a generation check so responses started before a mutation cannot overwrite the resulting UI state. Pause is persisted natively and overrides the legacy `isPausedToday` field in UI configuration. Scheduled rules survive normal app termination; they do not rely on a JS timer.

## Native actions and lifecycle

AppDelegate installs a retained `UNUserNotificationCenterDelegate` before UI creation. Snooze/pause/resume actions do not use `.foreground`, and execute in Swift even if the web view is not running. SceneDelegate opens the custom bridge controller, which explicitly registers the app-local Capacitor plugin.

Snooze adds an extra request approximately ten minutes later without shifting all regular rules. A regular reminder within those ten minutes takes precedence to avoid two close notifications. Pause removes regular/snooze requests and issues a silent confirmation with a resume action. Resume reinstalls the stored repeating/future one-off plan. Expired one-offs require new dates. Errors during native actions attempt a passive explanatory notification. Permission and sound settings remain controlled by iOS.

## Data and permissions

- Only notification authorization is requested; no calendar access, location, contacts, account or cloud backend.
- Reminder configuration/pause state live in application UserDefaults. Optional cup records live in the app WebView's localStorage and reset on the next foreground visit after local midnight.
- Native schedule configuration takes precedence on cold launch; optional cup records remain local UI data.
- No analytics, Gemini requests or remote runtime assets. Capacitor loads the bundled web output; no `server.url` is configured.
- Privacy manifest declares app-only UserDefaults use (`CA92.1`), no tracking and no collected data.
- Six supplied synthesized sounds are rendered offline as mono 44.1 kHz, 16-bit PCM WAV, 1.2 seconds each. Soft/clear differ in gain; sound files are copied into the native bundle root.

## Validation completed on this Mac

- `npm run lint`: TypeScript check passed.
- `npm test`: 22 meaningful schedule tests passed. Coverage includes workday selection, breaks overlapping overnight boundaries, month/year rollover, local timezone dates, DST gaps and the 62/63 boundary.
- `npm run test:native`: compiled and ran Foundation validation/persistence/capacity/snooze checks.
- Swift syntax parsing passed for all app-local files.
- Native scheduler typechecked against the installed macOS UserNotifications SDK, using a temporary check copy omitting only iOS's unavailable-on-macOS `.ephemeral` enum case. This found and fixed a base-trigger API mistake. It is partial validation, not an iOS build.
- `npm run ios:sync`: production Vite build and Capacitor resource synchronization passed.
- `npm run verify:ios`: four Swift files in target Sources, privacy resource, twelve WAV resources, soft/clear RMS relationship and complete offline web bundle passed.
- Xcode project/Info.plist/privacy plist parse checks passed; app icon is opaque-background 1024 × 1024, rendered from the supplied SVG mark.
- Browser checks at 390 px width: no horizontal overflow, zero observed warning/error logs; scheduling modes, real-date picker, sound choices, preview-only authorization error and dense-plan rejection worked. Native time-field changes were verified using real key events (AX value replacement alone does not dispatch React input events).
- Production npm dependency audit against the official registry returned zero reported vulnerabilities at verification time.

## Still required

This Mac has Command Line Tools but no Xcode. No iOS SDK build, simulator run, signing or physical iPhone test has been performed. First device validation must verify plugin loading, real system permission flow, custom sound lookup, notifications while locked and terminated, native actions after cold launch, pause/resume, and notification settings changes. Test low power mode, reboot, DST/timezone travel and long-term repeating behavior before release. Free Personal Team signing expires after seven days; it is a development deployment constraint, not a reason to reopen the app daily.

## Sources

- Capacitor iOS: https://capacitorjs.com/docs/ios
- App-local native plugin registration: https://capacitorjs.com/docs/ios/custom-code
- Apple scheduling local notifications: https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app
- Apple custom notification sounds: https://developer.apple.com/documentation/usernotifications/unnotificationsound
- Apple developer account limitations: https://developer.apple.com/help/account/basics/about-your-developer-account/
- Apple required-reason API manifest: https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons
