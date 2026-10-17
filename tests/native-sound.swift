import Foundation

@main
struct NativeSoundTests {
    static func main() throws {
        let directory = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("native/sounds")
        let temporary = FileManager.default.temporaryDirectory.appendingPathComponent("jide-sound-test-" + UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: temporary) }
        let source = try Data(contentsOf: directory.appendingPathComponent("ceramic_clear.wav"))
        let half = try ReminderSoundStore.scaledWAV(source, volume: 50)
        let zero = try ReminderSoundStore.scaledWAV(source, volume: 0)
        assert(half.prefix(44) == source.prefix(44))
        for offset in stride(from: 44, to: source.count, by: 2) {
            func sample(_ data: Data) -> Int16 { Int16(bitPattern: UInt16(data[offset]) | UInt16(data[offset+1]) << 8) }
            assert(abs(Int(sample(half)) - Int((Double(sample(source)) * 0.5).rounded())) <= 1)
            assert(sample(zero) == 0)
        }
        for invalid in [-1, 101] {
            do { _ = try ReminderSoundStore.scaledWAV(source, volume: invalid); fatalError("Invalid volume accepted") }
            catch { }
        }
        let store = ReminderSoundStore(sourceDirectory: directory, cacheDirectory: temporary)
        let prepared = try store.prepare(sound: "ceramic_clear.wav", volume: 50)
        assert(prepared.name!.hasPrefix("jide-v1-ceramic_clear-") && prepared.name!.hasSuffix("-v050.wav"))
        let written = try Data(contentsOf: prepared.url!)
        let muted = try store.prepare(sound: "ceramic_clear.wav", volume: 0)
        let full = try store.prepare(sound: "ceramic_clear.wav", volume: 100)
        assert(written == half && muted.name == nil)
        assert(full.url == directory.appendingPathComponent("ceramic_clear.wav"))
        let changedSources = temporary.appendingPathComponent("changed-sources")
        try FileManager.default.createDirectory(at: changedSources, withIntermediateDirectories: true)
        try half.write(to: changedSources.appendingPathComponent("ceramic_clear.wav"))
        let changedStore = ReminderSoundStore(sourceDirectory: changedSources, cacheDirectory: temporary)
        let changedFile = try changedStore.prepare(sound: "ceramic_clear.wav", volume: 50)
        assert(changedFile.name != prepared.name, "A changed source must not reuse stale volume audio")
        let oldDate = Date().addingTimeInterval(-180)
        try FileManager.default.setAttributes([.modificationDate: oldDate], ofItemAtPath: prepared.url!.path)
        try FileManager.default.setAttributes([.modificationDate: oldDate], ofItemAtPath: changedFile.url!.path)
        store.prune(keeping: [prepared.name!])
        assert(FileManager.default.fileExists(atPath: prepared.url!.path), "Keep the scheduled sound")
        assert(!FileManager.default.fileExists(atPath: changedFile.url!.path), "Remove obsolete unreferenced audio")
        do { _ = try store.prepare(sound: "../../secret.wav", volume: 50); fatalError("Invalid source accepted") }
        catch { }
        print("Native sound checks passed: PCM scaling, zero silence, file generation and source validation")
    }
}
