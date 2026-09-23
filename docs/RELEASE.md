# 发布流程与密钥清单

给本仓库（`clash-orbit/clash-orbit`）的维护者用。上游的发布链路本身是完整的，这里只记录
**换成一个 fork 之后**必须改动、必须配置的部分，以及踩过的坑。

## 当前状态

| 项目    | 值                                                                |
| ------- | ----------------------------------------------------------------- |
| origin  | `https://github.com/clash-orbit/clash-orbit`                       |
| upstream| `https://github.com/clash-verge-rev/clash-verge-rev`               |
| 分支    | `dev`（上游默认分支；发布要求 tag 落在 `main`）                     |
| 版本号  | `package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` 均为 `2.5.5` |

## 发布前必须先解决的两件事

### 1. 更新签名公钥还是上游的（阻塞项）

`src-tauri/tauri.conf.json` 里 `plugins.updater.pubkey` 目前仍是上游 Clash Verge Rev 的
minisign 公钥，而私钥只在上游手里。CI 用 `secrets.TAURI_PRIVATE_KEY` 给更新包签名，客户端
拿这个公钥校验——两者不匹配，自动更新必然失败。

先生成自己的密钥对：

```bash
pnpm tauri signer generate -w ~/.tauri/clash-orbit.key
```

它会输出公钥（base64）并把私钥写进文件。然后：

1. 把公钥填回 `tauri.conf.json` 的 `plugins.updater.pubkey`，提交；
2. 仓库 Settings → Secrets and variables → Actions 新增两项：
   - `TAURI_PRIVATE_KEY`：私钥内容整段（含 `untrusted comment:` 那一行）
   - `TAURI_KEY_PASSWORD`：生成时设置的口令

> 私钥丢了，已发布版本的更新链路就永久断掉。请离线备份。

### 2. tag 必须落在 `main` 分支上

`release.yml` 的第一个 job 会用 `git rev-list origin/main` 校验 tag 的提交是否在 `main`
上，不在就直接 `exit 1`。所以只把改动推在 `dev` 上打 tag 是发不出去的。

## 密钥清单

| Secret | 必需性 | 用途 | 不配置的后果 |
| --- | --- | --- | --- |
| `TAURI_PRIVATE_KEY` | **必需** | 给更新包签名 | `tauri-action` 生成不出 `.sig`，构建失败 |
| `TAURI_KEY_PASSWORD` | **必需** | 上面私钥的口令 | 同上 |
| `GITHUB_TOKEN` | 自动 | 建 Release、上传产物、生成 `update.json` | GitHub 内置，无需手工配置 |
| `TELEGRAM_BOT_TOKEN` | 可选 | 发布后发 TG 通知 | `notify-telegram` job 报错（制品已发布，不影响下载） |
| `WINGET_TOKEN` | 可选 | 提交到 `microsoft/winget-pkgs` | 该 job 已注释停用，见下文 |

macOS 支持已移除：不再构建 macOS 包，`APPLE_*` 系列 secret 也不再需要（历史上用于签名与公证）。

AI 审查工作流（`pr-ai-slop-review` 等）另有 `COPILOT_GITHUB_TOKEN` / `GH_AW_*` /
`WORKFLOW_AUDIT_TOKEN`，与发布无关。

## 发布步骤

1. 确认三处版本号一致，例如都是 `2.5.5`。
2. 把代码推送到 `main`。
3. 打 tag 并推送。tag 必须恰好是 `v` + 版本号：

   ```bash
   git tag v2.5.5
   git push origin v2.5.5
   ```

4. `Release Build` 被 tag 触发，job 按顺序跑（见下表）。
5. 所有平台产物传到 draft release 后，`update_tag` 生成 Release 说明并置
   `draft=false`——**自动转为正式发布**，不需要手工点发布。
6. `release-update` / `release-update-for-fixed-webview2` 运行 `pnpm updater`，在
   `updater` 这个 tag 下产出 `update.json` / `update-proxy.json`，也就是客户端
   `plugins.updater.endpoints` 去取的那个文件。

带 `-rc` 的 tag（如 `v2.6.0-rc`，注意此时 `package.json` 版本也必须写成 `2.6.0-rc`）
会发布为 prerelease，并跳过 Telegram 通知与 `update.json` 更新。日常想重跑更新清单，
可以手动触发 `.github/workflows/updater.yml`。

## 各 job 职责

| job | 做什么 |
| --- | --- |
| `check_tag_version` | 校验 tag 来自 `main`，且与 `package.json` 版本一致 |
| `prepare_release` | 先建一个 draft release |
| `release` | 矩阵构建 Windows x64/arm64、Linux x64，上传产物 |
| `release-for-linux-arm` | Linux arm64 / armv7 |
| `release-for-fixed-webview2` | 内置 WebView2 的 Windows 包 |
| `update_tag` | 生成 Release 说明、把 draft 转正式 |
| `release-update` | 生成 `updater` tag 下的 `update.json` |
| `notify-telegram` | 发 TG 通知 |

## 产物命名

`productName` 是 `Clash Orbit`，Tauri 会把空格换成点，所以：

- Windows：`Clash.Orbit_2.5.5_x64-setup.exe`、`..._arm64-setup.exe`、
  `..._x64_fixed_webview2-setup.exe`
- Linux：`Clash.Orbit_2.5.5_amd64.deb`、`Clash.Orbit-2.5.5-1.x86_64.rpm`

`release.yml` 里手写的下载链接和 `scripts/updater.mjs` 的资产匹配规则都依赖这些名字。
**改 `productName` 会同时改掉它们**，要一起改。

## 关于 winget

`release.yml` 的 `submit-to-winget` job **已被注释停用**，原因写在注释里：上游在 winget 的
标识符是 `ClashVergeRev.ClashVergeRev`，把本 fork 的安装包提交上去会把上游的包覆盖掉。
要自己发，先用 `ClashOrbit.ClashOrbit` 向 `microsoft/winget-pkgs` 提交一次，配好
`WINGET_TOKEN`，再恢复该 job，并把 `submit-to-winget` 加回 `notify-telegram` 的 needs。

## 发布前本地预检

```bash
corepack pnpm prebuild                 # 下载 mihomo 内核 / 服务 / geo 数据
corepack pnpm web:build                # tsc --noEmit && vite build
cargo check --workspace --all-targets
cargo fmt --all --check
corepack pnpm lint                     # eslint --max-warnings=0
corepack pnpm format:check             # biome
```

顺序有讲究：`cargo check` 之前必须先有 `dist/`（`web:build` 的产物），否则
`tauri::generate_context!()` 会因为 `frontendDist` 不存在直接 panic，报错信息只是
`proc macro panicked`，不容易看出根因。

## 已知问题

- 本机 `cargo test -p clash-orbit --lib` 的测试二进制在 Windows **加载阶段**就失败
  （`STATUS_ENTRYPOINT_NOT_FOUND`，退出码 `0xC0000139`），一个用例都跑不到。已用
  `git stash` 把改名改动临时移开对比过：上游原始代码同样失败，属预先存在的环境/工具链
  问题，与改名无关。其余 crate 的 lib 测试全部通过，且 `cargo check --all-targets`
  能证明测试代码本身可以编译。
- 上游 CI 的三个来源仍指向上游，属预期：`tracing-estuary` 用上游作者仓库、
  `clash-orbit-service-ipc` 的 release 只有上游发过 `v2.7.3`（`scripts/service-release.mjs`
  里保留了回退）、`docs` 链接仍指 `clash-verge-rev.github.io`。
