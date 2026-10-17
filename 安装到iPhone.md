# 把记得装到自己的 iPhone

这是可用 Xcode 打开的源码工程。当前 0.1.2 已通过 iOS 目标无签名编译；安装到手机仍需要你自己的 Apple 账户签名。真机声音效果要在手机上验证。

## 已经装过：这次怎样更新

1. 打开之前的同一个 `ios/App/App.xcodeproj`，连接并解锁 iPhone。当前工程目录已经更新，原来的签名团队和 Bundle Identifier 已保留。
2. 如果 Xcode 仍在运行旧版，先点左上角方形停止按钮，再按 **⌘R**。不要删除手机上的旧 App。
3. 新版首页有「喝了一杯」和右上角设置。进入「设置 → 声音与通知」验证声音：选择「清晰」→「测试所选提示音」→锁屏等 10 秒。再展开「通知没有声音？」→「测试系统默认音」→锁屏等 10 秒。
4. 这两种测试只用于比较，不改变正式提醒。选好后点「保存声音」。修改声音不会解除暂停。

不需要先上架 App Store。先用你的 Apple 账户安装到自己的手机，确认提醒体验，再考虑发布。

## 一、准备 Xcode

1. 在 Mac 的 App Store 安装苹果官方 [Xcode](https://apps.apple.com/app/xcode/id497799835)。当前工程使用 Capacitor 8，按其官方要求使用 Xcode 26 或更新版本。若 App Store 提示系统版本不兼容，需先更新 macOS 或选择兼容的开发环境。
2. 第一次打开 Xcode，完成苹果要求的组件安装；如果询问平台，安装 iOS 支持。
3. 在 Xcode → Settings → Accounts 中登录你自己的 Apple 账户。密码和验证码在苹果窗口里由你填写即可。

## 二、打开工程

1. 完整解压项目 ZIP，保持各目录的位置，不要只拿出里面的 `ios` 文件夹。
2. 打开 `ios` → `App` → **`App.xcodeproj`**。
3. 等待 Xcode 下载并解析 Swift Package 依赖。首次需要联网访问 GitHub；App 安装后的提醒功能不需要联网。
4. 选中左侧最上面的蓝色 **App** 工程，再选中 TARGETS 下的 **App**。
5. 进入 **Signing & Capabilities**，保持 **Automatically manage signing** 勾选，在 **Team** 选择你的个人团队（Personal Team）。
6. 如果 Bundle Identifier 提示被占用，把 `local.hydration.waterreminder` 改成你自己的唯一值，例如 `com.你的英文名.waterreminder`；实际填写时只使用英文、数字和点。以后覆盖安装请保持这个值不变。

## 三、连接手机并运行

1. 用数据线把 iPhone 连接 Mac，手机弹出提示时选择「信任」，并解锁手机。
2. 在 Xcode 顶部设备选择器中，选择你的真实 iPhone。
3. 如 Xcode 要求开启开发者模式，进入 iPhone「设置 → 隐私与安全性 → 开发者模式」，按系统提示重启并确认。若暂时看不到此选项，先让 Xcode 完成配对。
4. 点击 Xcode 左上角 ▶︎，或按 **⌘R**。这是首次真正编译、签名、安装并启动 App 的步骤。
5. 如果手机提示开发者不受信任，按 iPhone 提示进入「设置 → 通用 → VPN 与设备管理」，信任与你自己 Apple 账户对应的开发者。
6. 桌面出现水杯图标后，先按下面的流程验证，不要把“编译成功”当作“通知已经验证成功”。

不需要安装 CocoaPods，也不需要 Gemini API Key。包里已经附上页面和声音资源，首次打开工程通常不必运行 npm。

## 四、第一次使用与验证

1. 选择提醒模式。建议先用默认的工作日安排和每 60 分钟提醒完成初次体验。
2. 选择提示音与柔和/清晰版本，点击「启用提醒」，在 **iOS 系统弹窗**中允许通知。
3. 保存后首页应该显示下一次提醒。如果显示需要调整或保存失败，先处理提示。
4. 进入右上角「设置 → 声音与通知」，点击「测试所选提示音（10 秒后）」，锁屏，等待测试通知及声音。测试只验证送达与声音，不改变日程，也不提供正式提醒的操作按钮。
5. 若无声音，检查 iPhone「设置 → 通知 → 记得」中的允许通知、声音、锁定屏幕显示，并检查静音、专注模式与通知摘要。普通提醒不会绕过这些设置。
6. 要验证正式提醒，可临时选「每天」，把开始时间设为当前时间约 2 分钟后、结束时间约 7 分钟后，保存后退出 App 等待。这通常只生成一条每天重复的规则。跨午夜时 App 会标注次日结束。
7. 正式通知出现后，长按查看「稍后提醒」「暂停提醒」。暂停后会有一条静默确认通知，可长按选择「恢复提醒」。也可回 App 恢复。
8. 验证完，恢复你真正想用的日程。再测试午休不会提醒、工作日选择正确、修改声音生效、杀掉 App 后仍能按计划收到正式通知。

日常无需打开 App。需要修改安排、恢复已暂停的提醒，或为指定日期添加新日期时再进入即可。

## 五、免费安装的有效期

免费 Personal Team 的开发签名/描述文件通常 **7 天到期**，需要重新连接 Xcode 编译安装。覆盖安装时保持同一 Bundle Identifier；不要为了重签先删除 App，否则本机设置会丢失。

这种方式适合现在自己测试，不能当作长期免维护的正式发行方式。以后可以使用付费 Apple Developer Program，通过 TestFlight 做有有效期的测试，或上架 App Store 供长期安装。App 本身不要求每天打开，但开发测试签名仍受苹果规则限制。

## 出现错误时

- **需要开发团队 / Signing requires a development team**：重新检查 TARGETS → App → Signing & Capabilities 的 Team。
- **Bundle Identifier 不可用**：改为自己的唯一英文标识。
- **Package 依赖无法下载**：检查访问 GitHub 的网络，再在 Xcode 的包依赖菜单重试解析；本工程锁定 Capacitor 8.5.3。
- **找不到 Swift 文件或声音**：确认完整解压，并保持根目录的 `native`、`ios` 位置不变。不要只复制 `.xcodeproj` 文件。
- **日程过密**：系统待发通知数有限。增加提醒间隔或缩短时段，直到能完整保存；本版不会只保存前一部分。
- **第 7 天打不开**：重新通过 Xcode 覆盖安装。
- **其他编译或真机问题**：保留 Xcode 的第一条红色错误及手机系统版本，后续可以据此继续修复。编译已验证，真机行为仍以手机实际结果为准。

官方参考：[Capacitor iOS 要求](https://capacitorjs.com/docs/ios)、[Apple 免费账户与开发测试限制](https://developer.apple.com/help/account/basics/about-your-developer-account/)、[Apple 开发者模式](https://developer.apple.com/documentation/xcode/enabling-developer-mode-on-a-device)。
