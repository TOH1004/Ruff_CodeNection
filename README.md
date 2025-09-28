# ruff

A new Flutter project.

# Google drive link: (if can't access in github, can access in google drive)
https://drive.google.com/drive/folders/1R6QwF6w_NQpRM2Eo5T9ayz0FZ_ccGEdG?usp=drive_link

# FrontEnd (The ruff folder in this repo)
https://github.com/TOH1004/Ruff_frontend.git
- the backend folder are in this repository 

## User Guide

Ruff — Campus Safety App (Android) • User Guide
This guide walks you through installing Ruff from a GitHub APK and using its key safety features: journeys,
companions (friends/AI), auto■SOS, and reporting.
1) Before You Start
• Android 9 (Pie) or later recommended.
• Stable mobile data or Wi■Fi. SMS plan recommended for fallback beacons.
• Enough storage (~150 MB free).
• Campus email (if single sign■on is enabled) or a verified email account.
Permissions you’ll be asked for (and why):
• Location (precise, background): live tracking to destination, SOS dispatch, and SMS fallback coordinates.
• Camera & Microphone: live video/voice room, voice■analysis bubble, safe■word detection.
• Notifications: SOS alerts, friend joins, guard arrival.
• Physical activity (optional): motion anomalies (sudden stop/running at night).
2) Download & Install from GitHub (APK)
1 Open your browser and go to the project’s GitHub page → Releases.
2 Download the latest file ending with .apk (e.g., ruff-v1.0.0.apk).
3 When prompted, allow the browser (e.g., Chrome) to download this file.
4 Open the downloaded APK from the notification or your Downloads app.
First■time APK install (allow unknown apps):
• When Android blocks the install, tap Settings → Allow from this source for your browser (e.g., Chrome).
• Return to the installer and tap Install.
• If you see App not installed, remove any old Ruff builds first, then retry.
3) First Launch & Onboarding
1 Sign in (campus SSO or email, depending on your build).
2 Grant requested permissions when prompted (Location, Camera, Microphone, Notifications).
3 Set up Trusted Circles (Family, Flatmates, Coursemates) to receive urgent alerts.
4 Optionally choose your default AI Buddy mode: Silent • Chatty • Caring.
4) Home Screen Overview
• Start Now: begin a journey by setting current location and destination (creates a live call room).
• Status: see friends’ updates and journeys; post your own while on a journey.
• AI Buddy: choose Silent, Chatty, or Caring to accompany your walk.
• Report: file incidents; access shuttles, blue■light phones, escort services, and safety policies.
• Journey Cards: shows friends’ ongoing journeys with a Join button.
• Tabs: Chat for messages; History for past journeys (yellow two■faces = with friends; blue single■face =
solo/AI).
5) Start a Journey & Companions
1 Tap Start Now → select your destination → confirm.
2 A live Video Call Room opens: map (top), video feed (centre), SOS (bottom).
3 Invite Friends: they can tap Join from your home card or from your Status post.
4 Add AI Buddy: select mode; an AI tile joins the call as a calm companion.
6) Video Call Room & Safety Controls
• Map & ETA: real■time route sharing (with friends/security if SOS is active).
• SOS Button: press any time to trigger emergency response.
• Voice■Analysis Bubble (bottom■right): listens for distress cues and your safe word.
• Menu (■): Share Live Location, Captions, Motion Detection (sudden stop/running), Safe Word setup,
Voice Assist (reads banners aloud).
7) Auto■SOS Triggers & Countdown
• No■tap countdown: periodic check; if you don’t tap within 60 s, Ruff prepares SOS (cancel any time).
• Connection■loss: if data drops ≥30 s, Ruff asks if you’re safe; no response → triggers SOS.
• Voice analysis: detects distress keywords or aggression; may start a silent pre■SOS (tap to cancel).
• Safe word: your secret phrase that silently triggers SOS even if you can’t reach the screen.
8) SOS Response (Dual Action)
• Notify guardians & campus security: sends live location, journey details, and device status.
• Guide to nearest safe place: calculates a safe, well■lit route (shop/guard post) while help is en route.
• Show guard ETA on map; confirm on arrival with a popup.
• If mobile data is unavailable, send an SMS fallback beacon with GPS link to security and trusted
contacts.
9) After Resolution
• When safe, you’ll see You are safe now.
• Choose to Post a Safe■Now Status or Continue Journey.
• The trip is logged in History with the correct companion icon.
10) Status & Report
• Status: share updates with photos/location; set visibility (Public or Trusted). Friends can spot, join, or
check in.
• Report: submit incident forms (photos/video, category, optional anonymity), view shuttles, blue■light
phones, escort services, and campus policies.
11) Settings, Accessibility & Privacy
• Trusted Circles: pick who receives urgent alerts and live links.
• Voice Assist: have banner messages spoken aloud (TTS).
• Accessibility: captions, larger text, high■contrast mode, vibration cues.
• Privacy Presets: Solo / Friends / Security■only; control data retention and recording.
12) Troubleshooting
Issue Fix
APK blocked / unknown sourceSettings → Security → Install unknown apps → Allow for your browser; retry install.
App not installed Uninstall older Ruff build; ensure enough storage; reinstall the latest APK.
Location not updating Enable precise location; disable battery optimisations for Ruff; keep GPS on.
No notifications Allow notifications; enable background data; verify Android Do Not Disturb settings.
Maps not loading Check internet; allow location; try switching Wi■Fi/mobile data.
False SOS Dismiss countdown quickly; adjust no■tap interval; review safe word sensitivity in Settings.
Low signal areas SMS fallback will send your GPS to security/trusted contacts automatically.
13) FAQ
Do I need internet for SOS?
Internet is preferred for live tracking. If data drops, Ruff sends an SMS beacon with your GPS (requires SMS
plan).
Can I use Ruff without friends?
Yes. You can walk solo or with the AI Buddy. Security dispatch works regardless.
Who sees my Status posts?
Only the audience you choose: Public or Trusted circle.
What if I uninstall and reinstall?
You’ll need to sign in again and re■grant permissions. History is restored if your account is the same.
