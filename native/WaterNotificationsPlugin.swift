import Capacitor
import UIKit

@objc(WaterNotificationsPlugin)
public class WaterNotificationsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WaterNotificationsPlugin"
    public let jsName = "WaterNotifications"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermission", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "configure", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPaused", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "snooze", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "test", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setAppearance", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "openSettings", returnType: CAPPluginReturnPromise)
    ]
    public override func load() { WaterNotificationsDelegate.install() }
    @objc func status(_ call: CAPPluginCall) {
        Task { call.resolve(await ReminderScheduler.shared.status()) }
    }
    @objc func requestPermission(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(try await ReminderScheduler.shared.requestPermission()) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func configure(_ call: CAPPluginCall) {
        guard let json = call.getString("plan") else { call.reject("缺少提醒安排。"); return }
        Task {
            do { call.resolve(try await ReminderScheduler.shared.configure(json: json, paused: call.getBool("paused") ?? false)) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func setPaused(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(try await ReminderScheduler.shared.setPaused(call.getBool("paused") ?? false)) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func snooze(_ call: CAPPluginCall) {
        Task {
            do { call.resolve(try await ReminderScheduler.shared.snooze()) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func test(_ call: CAPPluginCall) {
        guard let sound = call.getString("sound") else { call.reject("请选择提示音。"); return }
        Task {
            do { call.resolve(try await ReminderScheduler.shared.test(sound: sound, useSystemSound: call.getBool("useSystemSound") ?? false)) }
            catch { call.reject(error.localizedDescription) }
        }
    }
    @objc func setAppearance(_ call: CAPPluginCall) {
        let appearance = call.getString("appearance") ?? "system"
        DispatchQueue.main.async {
            self.bridge?.viewController?.overrideUserInterfaceStyle = appearance == "dark" ? .dark : appearance == "light" ? .light : .unspecified
            self.bridge?.viewController?.setNeedsStatusBarAppearanceUpdate()
            call.resolve()
        }
    }
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else { call.reject("无法打开设置。"); return }
            UIApplication.shared.open(url, options: [:]) { success in
                if success { call.resolve() } else { call.reject("无法打开设置，请手动进入 iPhone 设置。") }
            }
        }
    }
}
