import Foundation
import CryptoKit

struct PreparedReminderSound {
    let name: String?
    let url: URL?
}

struct ReminderSoundStore {
    let sourceDirectory: URL
    let cacheDirectory: URL

    static var live: ReminderSoundStore {
        let library = FileManager.default.urls(for: .libraryDirectory, in: .userDomainMask)[0]
        return ReminderSoundStore(sourceDirectory: Bundle.main.resourceURL!, cacheDirectory: library.appendingPathComponent("Sounds"))
    }

    static func validateVolume(_ value: Int) throws {
        guard (0...100).contains(value) else { throw ReminderError.invalid("提示音音量应在 0–100% 之间。") }
    }

    // Only the app's known mono PCM16 export format is accepted; header bytes are preserved.
    static func scaledWAV(_ original: Data, volume: Int) throws -> Data {
        try validateVolume(volume)
        func word(_ offset: Int) -> UInt16 { UInt16(original[offset]) | UInt16(original[offset + 1]) << 8 }
        guard original.count >= 44, String(decoding: original[0..<4], as: UTF8.self) == "RIFF",
              String(decoding: original[8..<16], as: UTF8.self) == "WAVEfmt ",
              String(decoding: original[36..<40], as: UTF8.self) == "data",
              word(20) == 1, word(22) == 1, word(34) == 16, (original.count - 44) % 2 == 0 else {
            throw ReminderError.invalid("提示音格式无法读取，请重新安装完整 App。")
        }
        var output = original
        for offset in stride(from: 44, to: original.count, by: 2) {
            let sample = Int16(bitPattern: word(offset))
            let scaled = Int16((Double(sample) * Double(volume) / 100).rounded())
            let bits = UInt16(bitPattern: scaled)
            output[offset] = UInt8(bits & 255); output[offset + 1] = UInt8(bits >> 8)
        }
        return output
    }

    func cacheName(sound: String, volume: Int) throws -> String {
        let bytes = try Data(contentsOf: sourceDirectory.appendingPathComponent(sound))
        let fingerprint = SHA256.hash(data: bytes).prefix(6).map { String(format: "%02x", $0) }.joined()
        return "jide-v1-\(sound.dropLast(4))-\(fingerprint)-v\(String(format: "%03d", volume)).wav"
    }

    func prepare(sound: String, volume: Int) throws -> PreparedReminderSound {
        try Self.validateVolume(volume)
        guard ReminderPlan.sounds.contains(sound) else { throw ReminderError.invalid("请选择有效的提示音。") }
        let source = sourceDirectory.appendingPathComponent(sound)
        guard FileManager.default.fileExists(atPath: source.path) else { throw ReminderError.invalid("提示音资源缺失，请重新安装完整 App。") }
        if volume == 0 { return PreparedReminderSound(name: nil, url: nil) }
        if volume == 100 { return PreparedReminderSound(name: sound, url: source) }
        let name = try cacheName(sound: sound, volume: volume)
        let destination = cacheDirectory.appendingPathComponent(name)
        if !FileManager.default.fileExists(atPath: destination.path) {
            let audio = try Self.scaledWAV(Data(contentsOf: source), volume: volume)
            try FileManager.default.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
            try audio.write(to: destination, options: .atomic)
            #if os(iOS)
            try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: cacheDirectory.path)
            try FileManager.default.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: destination.path)
            #endif
        }
        try FileManager.default.setAttributes([.modificationDate: Date()], ofItemAtPath: destination.path)
        return PreparedReminderSound(name: name, url: destination)
    }

    func isAvailable(sound: String, volume: Int) -> Bool {
        guard ReminderPlan.sounds.contains(sound), (0...100).contains(volume),
              FileManager.default.fileExists(atPath: sourceDirectory.appendingPathComponent(sound).path) else { return false }
        if volume == 0 || volume == 100 { return true }
        guard let name = try? cacheName(sound: sound, volume: volume) else { return false }
        return FileManager.default.fileExists(atPath: cacheDirectory.appendingPathComponent(name).path)
    }

    func prune(keeping names: Set<String>, now: Date = Date()) {
        guard let files = try? FileManager.default.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: [.contentModificationDateKey]) else { return }
        for file in files where file.lastPathComponent.hasPrefix("jide-") && file.pathExtension == "wav" && !names.contains(file.lastPathComponent) {
            if let date = try? file.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate,
               now.timeIntervalSince(date) > 120 { try? FileManager.default.removeItem(at: file) }
        }
    }
}
