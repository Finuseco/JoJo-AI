#!/usr/bin/env bash
# Execute on the dedicated emulator host, after installing Google's command-line tools.
set -euo pipefail
: "${ANDROID_SDK_ROOT:?Configure ANDROID_SDK_ROOT with the official Google SDK}"
[[ $(uname -s) == Linux && $(uname -m) == x86_64 && -r /dev/kvm && -w /dev/kvm ]] || { echo 'Linux x86_64 with accessible KVM required.' >&2; exit 1; }
sdkmanager="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
avdmanager="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/avdmanager"
# Licences must have been reviewed and accepted by the operator; no automatic yes.
"$sdkmanager" --install 'emulator' 'platform-tools' 'system-images;android-34;google_apis;x86_64'
"$ANDROID_SDK_ROOT/emulator/emulator" -accel-check
device_list=$(mktemp)
trap 'rm -f "$device_list"' EXIT
"$avdmanager" list device > "$device_list"
if ! grep -Fq '"pixel_7"' "$device_list"; then
  echo 'Official Pixel 7 profile unavailable; update the SDK tools. No substitute selected.' >&2; exit 1
fi
# No --force: never overwrite an existing virtual device.
printf 'no\n' | "$avdmanager" create avd -n JoJo_Pixel_7 -k 'system-images;android-34;google_apis;x86_64' -d pixel_7
printf '%s\n' 'AVD created. Boot, APK installation and WebRTC acceptance tests remain required.'
