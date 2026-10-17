# 记得 · 中国大陆 App Store 上架准备

核对日期：2026-10-18。首发地区：中国大陆为主。当前本地测试版：0.3.2（构建 8）。本文是当前工程的准备清单，不代表已经提交或获得上架批准。

## 已有与缺口

| 项目 | 当前状态 | 下一步 |
| --- | --- | --- |
| 应用名「记得」 | 本地 App 与通知已使用该品牌 | 在 App Store Connect 创建记录时校验商店名称可用性 |
| 图标、配色、提示音 | 已有 1024px 图标、两套主题、6 种可选音色及基础音量滑轨（安装包含旧音兼容资源） | 保留素材来源与使用权记录 |
| 原生提醒 | 已有本地日历通知和稍后/暂停操作 | 在 TestFlight 发行包复验锁屏、退出 App、午休与跨天 |
| 代码验证 | 已有 TypeScript、日程/界面/音频回归与资源检查；开发签名 Release 已真机安装到 0.3.2 | 正式 Archive、分发签名、隐私报告及上传校验尚未完成 |
| 付费开发者会员 | 之前使用 Personal Team 测试，未核实付费会员状态 | 由账户持有人完成注册、身份验证及付费 |
| 大陆备案适用性 | 待确认，当前是离线工具 | 向 Apple Developer Support 及主办者所在地通信管理局确认 |
| 隐私说明 | 有本机存储声明；尚无 App 内政策入口、公开政策 URL；音量缓存读取文件时间的声明仍待补齐 | 补政策/入口及文件时间戳使用理由，再复核 SDK 与最终包 |
| 技术支持 | 尚无公开支持页和已确认的客服邮箱 | 准备能联系到开发者的支持页 |
| 商店素材 | 有文案草稿和界面预览；未验证 App Store Connect 记录，正式提交截图待制作 | 名称/副标题/描述/关键词/分级/价格/地区/版权/审核资料与正式截图 |
| 健康短语 | 14 条有来源的离线短语，来源目前仅在维护文档中 | 建议在关于页提供来源及一般科普说明，明确八杯是可选记录界面 |

此次改名保留 Bundle Identifier、签名团队、存储键和日程标识，覆盖安装可延续已有本机设置。没有修改显示在 Xcode 内部的 App target/scheme 名称。

## 1. 账户、费用与名称

个人可以注册 Apple Developer Program 发布 App。中国大陆可通过 Apple Developer App 办理，需 Apple 账户双重认证和实名验证；个人法定姓名会作为供应商显示在 App Store。会员官方年费为 99 美元或适用的本币价格，实际按注册页面结算。[苹果注册说明](https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app)、[会员费用](https://developer.apple.com/cn/programs/whats-included/)

当前用户批准的应用名为「记得」。商店存在「记得提醒」「记得日历」等相近名称；这不等于「记得」已经被占用，也不能证明可以注册。创建 App Store Connect 记录时校验名称；如需更易区分，可考虑商店名称「记得 - 轻轻提醒喝水」，桌面仍显示「记得」。这只是候选，不自动替用户更改已确认的品牌。[相近名称实例](https://apps.apple.com/cn/app/id1533635570)、[App 信息规则](https://developer.apple.com/cn/help/app-store-connect/reference/app-information/app-information/)

## 2. 中国大陆备案：先确认适用性

苹果帮助说明：部分 App 在中国大陆提供时需要有效的 ICP 备案信息。工信部通知针对在境内从事互联网信息服务的 APP 主办者。[苹果大陆供应要求](https://developer.apple.com/cn/help/app-store-connect/reference/app-information/app-information/)、[工信部通知](https://www.miit.gov.cn/jgsj/xgj/wjfb/art/2023/art_dd783a581c9644a4aee10afa582811db.html)

当前代码核对结果：提醒由 iOS 本地触发，设置与杯数留在设备；未发现业务联网请求、云服务、广告或分析 SDK。这个事实支持先按纯离线工具询问适用性，但尚未获得 Apple 或主管部门对本 App 的确认，不能据此直接断言免备案或一定要备案。

可向官方咨询的说明（草稿，尚未发送）：

> 拟在中国大陆 App Store 发布「记得」，一款离线喝水提醒工具。所有提醒由 iOS 本地通知触发，时间设置及饮水记录仅存本机，没有账号、服务器、广告、统计 SDK、云同步或远程推送。请问此类完全离线 App 是否需要提交 App 备案号？若不适用，应如何在 App Store Connect 的大陆供应信息中说明？App 内会提供离线隐私说明，商店资料另含公开隐私政策和支持网址。

如果受理要求备案，再按主办者所在地和实际接入/分发渠道准备主体实名、最终名称/图标、Bundle ID、签名公钥或指纹及实际使用的网络资源等资料。名称、主体、标识与商店资料应一致；尚无已核实的办理周期或代理费用。

以后新增登录、云同步、远程内容、在线页面或第三方 SDK 时，需重新核对适用性；“提醒离线”不自动等同于整款 App 完全不联网。

## 3. 隐私与支持资料

苹果要求 App Store Connect 填公开隐私政策 URL，并在 App 内提供易找到的隐私政策入口；支持网址应能找到真实的联系渠道。当前两项都缺。[审核指南 5.1.1](https://developer.apple.com/app-store/review/guidelines/#privacy)、[支持网址要求](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/)

需要明确的信息：

- 发布者/运营者名称，以及用于用户反馈的邮箱。
- 设置和杯数怎样保存在本机、如何删除、本机/系统备份的边界。
- 只请求通知权限，怎样到 iPhone 设置关闭权限。
- 不上传记录、不做广告追踪，第三方代码的实际数据行为。
- 生效日期及政策更新方式。

本次代码核对发现一个具体的工程待办：音量缓存清理会读取 `contentModificationDateKey`，但 App 自身的 `PrivacyInfo.xcprivacy` 目前只声明 UserDefaults。应补齐文件时间戳类别及适用理由（仅访问 App 自身容器中文件元数据可用 `C617.1`），并在 Archive 的隐私报告中复核。这是工程声明问题，不能用网页隐私政策代替。[Apple 时间戳 API 与理由说明](https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype)

按当前代码与苹果对“收集”的定义，App Privacy 可朝“不收集数据”填写；提交前还要复核最终发行包及集成 SDK。仅在设备上处理的数据不等于向开发者收集数据。公开支持网站本身的日志等也应如实说明。[Apple 数据收集定义](https://developer.apple.com/app-store/app-privacy-details/)

无需为了提交此版添加账号、日历权限、健康数据权限或远程推送服务器。隐私政策与支持网页仍需有可公开访问的 URL，App 内可同时提供离线可读的说明。网址与托管方式须结合大陆合规要求选择，当前未购买域名或发布网页。

## 4. 商店资料与截图

建议的简体中文草稿见 APP_STORE_COPY.md。正式提交前准备：

- App 名称、副标题、描述、关键词、主要语言、类别和年龄分级问卷。
- App 图标、实际 App 截图、版权信息。
- 隐私政策 URL、支持 URL、审核联系人资料。
- App Privacy 答案和出口合规问卷，按最终包实际情况填写。
- 首发定价和可售地区；目前没有内购功能，收费方式尚未由用户决定。

本项目只声明 iPhone 设备族。当前截图规格要求至少一张支持的中等显示尺寸灵动岛 iPhone 截图，每种设备尺寸最多 10 张，本次建议准备 5 张；提交时以 App Store Connect 当前尺寸校验为准。若以后支持 iPad，还需相应 iPad 素材。[截图规格](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)

五张截图建议：首页、工作安排与午休、指定日期、提示音、锁屏通知操作。必须展示真实功能；当前带有“网页预览”字样的图片仅供设计检查，不是正式提交素材。

审核说明突出原生本地通知、保存日程后无需每天打开、通知长按操作。苹果 4.2 关注实用功能，当前工程有原生能力，但仍需由苹果审核实际完成度。[审核指南 4.2](https://developer.apple.com/app-store/review/guidelines/#minimum-functionality)

## 5. 最后一次发行验证

- [ ] 补齐音量缓存的文件时间戳使用理由，并核对最终包/SDK 隐私报告。
- [ ] 在正式接受的 Xcode/SDK 下 Archive，通过分发签名及上传校验；仅无签名编译不等于完成上架。
- [ ] App Store Connect 中 Bundle ID 与工程一致，最终发布版本/构建号已确认。
- [ ] TestFlight 发行包在真实 iPhone 上：首次授权、锁屏通知、各音色及不同基础音量、0% 静音、暂停/恢复、稍后提醒均符合预期。
- [ ] 日程覆盖每天、自选工作日、指定日期、午休、跨午夜；关闭 App 和重启设备后验证下一次提醒。
- [ ] 新一天重新打开时杯数重置；记杯数不改变通知日程；桌面图标静态。
- [ ] 拒绝权限/关闭声音后有真实提示；不承诺绕过静音、专注模式或独立系统通知音量。
- [ ] App 内和商店的隐私/支持信息完整可用，截图与当前版本一致。
- [ ] 复核健康短语来源、一般科普定位与八杯记录说明；不承诺治病、排毒或适用于所有人的固定饮水量。
- [ ] 由账户持有人选择发布方式后提交审核；本次未代注册、购买会员、提交备案或发布 App。

建议先用 TestFlight 邀请少量测试员跑完一次工作日和休息日。外部 TestFlight 测试需要经过相应审核，构建最长可测试 90 天。[TestFlight 流程](https://developer.apple.com/cn/help/app-store-connect/test-a-beta-version/testflight-overview/)

当前优先顺序：确认开发者会员 → 核对纯离线 App 的大陆备案适用性 → 补隐私与支持入口 → 制作商店素材 → 分发签名/上传 → TestFlight → App Store 审核。


## 当前责任分工

用户先确认：个人或组织作为发布主体、是否已经开通付费 Apple Developer Program、可公开的支持邮箱，以及免费/付费与首发地区。身份验证、法律协议与付款由账户持有人在苹果流程中处理；本次没有注册、付款或发送官方咨询。

工程与素材待办：补隐私/关于/支持入口与文案，落实可公开访问的政策和支持页面，补缓存时间戳理由及复核 SDK 隐私报告，制作真实商店截图，准备审核备注并进行正式 Archive/上传校验。域名、服务器、商标和软著不应未经适用性确认就作为本离线 App 的固定采购清单；网页托管和大陆发行所需资料按最终方案核实。

上线前先经 TestFlight 小范围验证，再提交 App Store 审核。开发签名安装通过不代表已经通过商店发行验证；本次仅更新准备说明，未提交上传或审核。
