# Implementation and verification notes

## Intended behavior

The installed app is an offline hydration reminder. Setup is occasional; reminder delivery must not require reopening a web page each day. Workdays are chosen by the user, rather than inferred from statutory holiday calendars. The supplied visual design and sound synthesis are retained. Pause is explicitly persistent until resumed.

## Scheduling

`src/native/plan.ts` compiles each selected time slot into a repeating daily/weekly `UNCalendarNotificationTrigger`, or a date-specific nonrepeating trigger. End times are exclusive. Earlier end times mean the following day; equal start/end times are invalid. Breaks are subtracted as intervals; spacing restarts at the end of a break. After-midnight work slots belong to the following calendar weekday while retaining the originally selected shift day.

Dates are local calendar dates, not UTC `toISOString()` values. Invalid dates, empty selections and expired one-off schedules are rejected. JS fixed dates and foreground next-occurrence estimates skip nonexistent local times during a DST spring-forward gap. Recurring triggers are ultimately matched by iOS; system-calendar, timezone-travel and DST behavior require device validation. Changes to the device's calendar/timezone are not handled through an always-running background process.

At most 62 distinct schedule requests are accepted, reserving capacity for one test and one snooze under the platform's 64-request limit. Dense plans fail before replacement; they are not silently truncated or kept alive through an unreliable rolling queue. Daily and weekly repeating requests continue beyond their first firing.

`native/ReminderScheduler.swift` serializes mutations and status snapshots across async notification-center calls. A replacement captures prior owned requests, removes them, adds the new rules and reads pending IDs back. If installation fails, it attempts to restore prior requests and reports failure, including incomplete restoration. The persisted plan changes only after successful installation. This is an application-level transaction, not crash-atomic: process termination during replacement may leave an incomplete queue; the next foreground status check reports unhealthy pending rules and asks the user to resave. It does not promise automatic repair while terminated.

Foreground refreshes carry a generation check so responses started before a mutation cannot overwrite the resulting UI state. Pause is persisted natively and overrides the legacy `isPausedToday` field in UI configuration. Scheduled rules survive normal app termination; they do not rely on a JS timer.

## Simplified UI and sound diagnosis (0.1.1)

A healthy home exposes just the drink-record button and settings entry. Permission or schedule errors add a contextual recovery action. Schedule and sound edits return independently to settings; saving preserves the native pause state. Appearance explicitly passes system/light/dark through the bridge, using UIKit `.unspecified` for system so WebView matchMedia can follow OS changes.

Sound settings use native select fields and one explicit preview button. The diagnostic section compares the selected custom sound and `UNNotificationSound.default` through real lock-screen notifications; tests never replace the saved plan. The native status reports the saved filename, bundle resource availability, actual sound authorization and pending test deadline. An outstanding test blocks the next test to avoid replacing it.

New one-off tests, snoozes and confirmation/error notifications use absolute Gregorian UTC calendar components. Reading an interval trigger's nextTriggerDate produces a date relative to each query, so using it as an absolute pending deadline made the test countdown drift. The fixed calendar deadline is covered by the native trigger regression check.

The user's prior built app contains all twelve byte-identical, non-silent, supported PCM WAV files. No deterministic sound-selection/format defect has been found. The user reports Silent/Focus off, Sounds allowed, alert volume normal, and soft sound selected. The user subsequently confirmed the sound plays but is too quiet during video playback; see the 0.1.3 audio update below. Desktop dynamic icons and WidgetKit are deferred.

## Native actions and lifecycle

AppDelegate installs a retained `UNUserNotificationCenterDelegate` before UI creation. Snooze/pause/resume actions do not use `.foreground`, and execute in Swift even if the web view is not running. SceneDelegate opens the custom bridge controller, which explicitly registers the app-local Capacitor plugin.

Snooze adds an extra request approximately ten minutes later without shifting all regular rules. A regular reminder within those ten minutes takes precedence to avoid two close notifications. Pause removes regular/snooze requests and issues a silent confirmation with a resume action. Resume reinstalls the stored repeating/future one-off plan. Expired one-offs require new dates. Errors during native actions attempt a passive explanatory notification. Permission and sound settings remain controlled by iOS.

## Data and permissions

- Only notification authorization is requested; no calendar access, location, contacts, account or cloud backend.
- Reminder configuration/pause state live in application UserDefaults. Optional cup records live in the app WebView's localStorage and reset on the next foreground visit after local midnight.
- Native schedule configuration takes precedence on cold launch; optional cup records remain local UI data.
- No analytics, Gemini requests or remote runtime assets. Capacitor loads the bundled web output; no `server.url` is configured.
- Privacy manifest declares app-only UserDefaults use (`CA92.1`), no tracking and no collected data.
- Six sounds are offered, rendered offline as mono 44.1 kHz, 16-bit PCM WAV. Their soft/clear assets plus retired compatibility assets total 24 bundle files. New settings use clear-source PCM amplitude scaling, described under 0.3.0 below.

## Validation completed on this Mac

- `npm run lint`: TypeScript check passed.
- `npm test`: schedule/UI and offline audio regression tests passed. Coverage includes workday selection, breaks overlapping overnight boundaries, month/year rollover, local timezone dates, DST gaps and the 62/63 boundary.
- `npm run test:native`: compiled and ran Foundation validation/persistence/capacity/snooze checks plus actual UserNotifications absolute trigger checks.
- Swift syntax parsing passed for all app-local files.
- Native scheduler typechecked against the installed macOS UserNotifications SDK, using a temporary check copy omitting only iOS's unavailable-on-macOS `.ephemeral` enum case. This found and fixed a base-trigger API mistake. It is partial validation, not an iOS build.
- `npm run ios:sync`: production Vite build and Capacitor resource synchronization passed.
- `npm run verify:ios`: four Swift files in target Sources, privacy resource, twelve WAV resources, soft/clear RMS relationship and complete offline web bundle passed.
- Xcode 27.1 generic iOS unsigned build passed.
- Xcode project/Info.plist/privacy plist parse checks passed; app icon is opaque-background 1024 × 1024, rendered from the supplied SVG mark.
- Browser checks at 320/390/768/1024/1440 px widths: no horizontal overflow, zero observed warning/error logs; scheduling modes, real-date picker, sound choices, preview-only authorization error and dense-plan rejection worked. Native time-field changes were verified using real key events (AX value replacement alone does not dispatch React input events).
- Production npm dependency audit against the official registry returned zero reported vulnerabilities at verification time.

## Still required

This Mac now has Xcode 27.1. A generic iOS target build with CODE_SIGNING_ALLOWED=NO succeeds, using an isolated DerivedData directory. The earlier macOS typecheck was partial validation from before Xcode was installed. The user installed the prior version on a physical iPhone and receives notifications, and now confirms the selected soft sound is audible but too quiet during video playback. The updated audio build still requires device listening tests, plus validation of native actions after cold launch, pause/resume and settings changes. Test low power mode, reboot, DST/timezone travel and long-term repeating behavior before release. Free Personal Team signing expires after seven days; it is a development deployment constraint, not a reason to reopen the app daily.

## Sources

- Capacitor iOS: https://capacitorjs.com/docs/ios
- App-local native plugin registration: https://capacitorjs.com/docs/ios/custom-code
- Apple scheduling local notifications: https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app
- Apple custom notification sounds: https://developer.apple.com/documentation/usernotifications/unnotificationsound
- Apple developer account limitations: https://developer.apple.com/help/account/basics/about-your-developer-account/
- Apple required-reason API manifest: https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons

## Brand rename (0.1.2)

The user chose the display name 记得. Home/header, notification mockups, Info.plist and Capacitor appName now use it. The bundle identifier, target/scheme, persisted storage keys and reminder identifiers are unchanged, preserving the installed app and its local settings. This is a local source update, not an App Store name reservation or release.

Rename verification: the delivered project passed an unsigned generic iOS Release build. The built bundle reports display name 记得, version 0.1.2 build 3 and the unchanged bundle identifier; all twelve sounds and current web resources match the delivery. This is not an App Store distribution validation.

## Reminder audibility update (0.1.3)

Read-only device inspection found version 0.1.1 build 2 installed, with morning_soft.wav saved, sound authorization enabled and eight repeating everyday rules. Original WAVs matched the original offline synthesis sample-for-sample; they were non-silent supported PCM. This rules out a stale synthesis/export mismatch in the inspected project, not every possible device sound issue. The user's confirmation narrows this occurrence to insufficient audibility.

The original exponential envelope decayed rapidly. All six tones now use a gradual 25 ms minimum attack, a stronger sustained body and a longer smooth tail. Frequencies, waveforms and filters remain unchanged. Soft/clear gains remain distinct. The twelve bundle WAVs are re-rendered from the same function used for preview. No system-volume API, critical alert, background playback or audio-session override is added.

For morning_soft.wav, full-file RMS changes from −30.7 to −19.3 dBFS (+11.5 dB); the first-to-last sample span above absolute amplitude 0.01 changes from 0.322 to 1.051 seconds. This threshold is an offline engineering proxy, not a prediction of perceived loudness over a speaker or video. Other tones are balanced to avoid large level differences. All peaks retain headroom; no PCM sample clips. Offline regression tests cover minimum RMS, signal span, finite samples, headroom and clear-vs-soft separation. A legacy wood selection now consistently displays its existing bamboo mapping instead of showing celesta while scheduling bamboo.

Attention Aware can lower alert volume while the user looks at the device (Apple support: https://support.apple.com/zh-cn/102216). Its state was not inspected, so it is a possible contributing system factor, not an established cause. A WebKit AudioSession interruption warning was observed; preview audio and system-rendered UNNotificationSound take different paths, and no causal link to this symptom was established. Queue ID/resource checks do not prove per-notification playback or acoustic loudness. No claim is made that another app suppresses notifications.

Install 0.1.3 over the existing app, save the chosen sound once, and compare a real test notification in the original video-playing context. Do not delete local settings or force system audio/privacy preference changes. Device listening and normal-volume comfort testing remain required before release.

0.1.3 delivery verification: TypeScript and all 73 automatic checks passed; production web build/sync, iOS resource verification and both unsigned and signed generic iOS Release builds passed. All twelve WAVs in the built bundle match regenerated source files, and bundled web assets match the delivery. Browser inspection at 390 × 844 showed no horizontal overflow or observed warning/error logs. Apple reports a non-blocking AppIntents metadata extraction warning because this target does not link AppIntents.

The signed build was installed over the connected user's existing app. A subsequent device app query confirms display name 记得, version 0.1.3, build 4. Read-only own-app preferences confirm semantic preservation of the native plan, selected morning_soft.wav, eight rules and pause state. Acoustic listening while the video plays is still awaiting the user's confirmation.

## Natural reminder collection (0.2.0)

Added brook, shore, breeze, birds, ceramic and woodland, with both soft and clear variants. They use deterministic procedural synthesis: shaped filtered noise, curved water/bird phrases and damped material resonances. They are designed nature impressions, not field recordings. No remote audio dependency or external sound asset is introduced. Original tones and selected user preferences are retained.

The single existing sound selector groups nature impressions and warm tones. Preview busy time follows the selected file duration. JS validation uses the offered catalog, Swift validates all 24 exact filenames, and resource verification compares the native allowlist to exported assets and target membership. Export uses the same synthesis as preview.

134 automatic checks pass, including new gradual-onset/fade and tone-to-notification filename checks; native model/trigger checks pass. Each new sound is 1.8 seconds, with average digital level balanced against the existing set. Soft/clear remain distinct and no file clips. Digital measurements do not prove that an individual listener finds a tone natural or comfortable; the supplied collection supports direct comparison.

0.2.0 delivery verification: the existing signed delivery project passed a generic iOS Release build and strict signature verification. The app reports 记得 0.2.0 build 5; all 24 bundled WAVs and web assets match the delivery/source. Six new selector options were exercised at 390px width without overflow or observed warning/error logs. The build retains the existing signing team and bundle identifier. The device initially lacked a usable development connection. After the user reconnected and unlocked it, the signed build was installed over the existing app. A device query confirms 记得 0.2.0 build 5; read-only comparison confirms the native plan, eight rules, chosen sound and pause state are preserved. New tone listening remains user-initiated.


## Sound controls (0.3.0)

Delivered in the requested order: preview defect, six retired options, then base-volume slider. An isolated fake Web Audio regression reproduced reuse of an interrupted context and a swallowed resume failure; it did not reproduce the user's exact physical-device occurrence. Browser preview now creates a fresh context, surfaces failures and bounds a nonresolving resume. iPhone preview instead uses AVAudioPlayer on the main queue, reading the same prepared WAV used by local notifications. Each explicit preview activates a mixing playback session and releases it on completion, cancellation, interruption, error, backgrounding or watchdog expiry. Token/player identity plus frontend generation checks prevent obsolete callbacks from stopping a newer preview.

Removed bamboo, chime, brook, shore, breeze and birds from the selectable catalog, leaving celesta, raindrop, singingbowl, morning, ceramic and woodland. Old selected plans migrate to celesta while preserving rules/configuration/pause. Replacement uses the existing transactional queue path. Retired WAVs stay in the bundle so notifications queued before the update remain valid before the next launch. They are not offered for selection.

A single accessible rectangular range replaces the soft/clear selector. It stores an integer 0–100, with legacy soft/clear display fallbacks of 65/100. New plans use the clear source plus numeric volume. Missing native volume keeps old file amplitude unchanged until resaved, avoiding scaling an old soft file twice. Zero means notification content has no sound. Slider changes are drafts; Save commits them. Tests use the draft without replacing the regular plan.

ReminderSoundStore validates known PCM16 exports and scales samples offline. Intermediate volumes write atomically to Library/Sounds, with source-content hashes in filenames and post-first-unlock file protection. The same prepared file is used by native preview, test, configure, snooze and resume. Cache pruning protects the saved-plan/test sound and leaves a 120-second grace period for other recent files. It never touches system-volume APIs or requests critical alerts/background playback. The system's alert volume and sound policies still apply.

Validation: 87 TypeScript/UI/offline-audio tests pass; native model, absolute-trigger and actual PCM/cache tests pass. Tests check half-amplitude samples, silence, invalid volume, original headers, content-hash changes and cache pruning. The complete iOS target builds successfully. At 320/390px the selector/slider fit without horizontal overflow; keyboard endpoints reach mute/maximum and observed console warnings/errors were zero. No speaker playback or test notification was triggered during these checks. Listening on the physical iPhone remains required to confirm the original sequence and comfortable loudness.


0.3.0 delivery verification: the delivered project retained the user's signing team and Bundle Identifier and passed a signed generic iOS Release build plus strict signature verification. The built Info.plist reports 记得 0.3.0 build 6; all 24 bundle WAVs and generated web files match the delivery. The only build warning is skipped optional AppIntents metadata extraction. Installation over the connected iPhone succeeded; a subsequent device app query confirms 0.3.0 build 6. Read-only before/after own-app preferences compare semantically equal: eight reminder rules, the selected ceramic_soft.wav and pause state are unchanged. The app was not launched or made to play notifications as part of installation verification. The user can open Sound & Notifications, adjust/save and repeat the original test-notification → preview flow.


## Daily health phrase (0.3.1)

HomeScreen replaces its fixed cup caption with DailyHealthTip, keeping the existing secondary text style and controls. Fourteen bundled phrases cover hydration, possible dehydration signs, drink choices and taking movement breaks. HEALTH_TIPS.md maps every phrase to reviewed public-health sources. Copy does not diagnose a symptom, prescribe a fixed intake or promise that drinking water treats sedentary risk.

Selection uses the device's local year/month/day as a calendar ordinal, not a UTC date or elapsed 24-hour interval. It stays fixed during a day and cycles every fourteen days, including month/year/leap-day boundaries. The mounted caption uses one timeout to the next local midnight and refreshes on document visibility/window focus; cleanup removes both listeners and the timeout. Calendar-based midnight handles 23/25-hour DST days. There is no fetch, additional permission, persistent tip history or background execution requirement. Reopening after any number of skipped days immediately selects the current date.

Ninety automated checks pass, including local-day stability, month/year/leap-day transitions, fourteen unique consecutive days, Chinese midnight and actual New York DST day lengths. TypeScript passes. Native notification and audio code are unchanged.


0.3.1 delivery verification: the signed Release target builds and verifies successfully. The built bundle reports 记得 0.3.1 build 7 and all web resources match the delivery. Browser checks at 320px (dark) and 390px (dark/light) show the daily phrase without horizontal overflow or observed console warnings/errors; a preview screenshot is delivered. The phone update succeeded and a device query confirms 0.3.1 build 7. Before/after own-app preferences preserve the native plan, eight rules, sound/volume and pause state. Real midnight rollover was verified through calendar/DST regression tests, not by changing the user's device clock or waiting for a real midnight.


## Branded notification title (0.3.2)

Regular/snooze reminder content now uses the exact title `记得 喝口水吧` (one ASCII space). The body stays the same. When status loads, only pending water.rule.* / water.snooze requests with the old exact title are replaced, using the original identifier, trigger and mutable-copied content; no plan recompile or permission request is involved. The existing actor transaction lock serializes this with user actions. Failed updates leave a visible migration notice and retry at a later status refresh. Pause state, configuration, file volume, dates and actions are retained. Test/pause/error notifications and previously delivered notifications are outside the update filter.

The internal app-only migration notice field is generalized from soundMigrationNotice to migrationNotice so sound and title updates share the existing UI message handling. Apple documents replacement of pending requests when adding a new request with the same identifier: https://developer.apple.com/documentation/usernotifications/unnotificationrequest/identifier .
