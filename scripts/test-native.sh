#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
swiftc native/ReminderPlan.swift tests/native-core.swift -o build/native-core-tests
build/native-core-tests
swiftc native/ReminderPlan.swift tests/native-triggers.swift -o build/native-trigger-tests
build/native-trigger-tests
swiftc native/ReminderPlan.swift native/ReminderSoundStore.swift tests/native-sound.swift -o build/native-sound-tests
build/native-sound-tests
