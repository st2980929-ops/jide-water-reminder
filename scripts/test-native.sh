#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build
swiftc native/ReminderPlan.swift tests/native-core.swift -o build/native-core-tests
build/native-core-tests
