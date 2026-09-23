import {
  Box,
  Button,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  styled,
} from '@mui/material'
import { convertFileSrc } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { exists } from '@tauri-apps/plugin-fs'
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BaseDialog, DialogRef, Switch, TooltipIcon } from '@/components/base'
import { DEFAULT_HOVER_DELAY } from '@/components/proxy/proxy-group-navigator'
import { useOrbit } from '@/hooks/use-orbit'
import { useWindowDecorations } from '@/hooks/use-window'
import { copyIconFile, getAppDir } from '@/services/cmds'
import { showNotice } from '@/services/notice-service'
import getSystem from '@/utils/get-system'

import { GuardState } from './guard-state'

const OS = getSystem()

const clampHoverDelay = (value: number) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_HOVER_DELAY
  }
  return Math.min(5000, Math.max(0, Math.round(value)))
}

const getIcons = async (icon_dir: string, name: string) => {
  const updateTime = localStorage.getItem(`icon_${name}_update_time`) || ''

  const icon_png = await join(icon_dir, `${name}-${updateTime}.png`)
  const icon_ico = await join(icon_dir, `${name}-${updateTime}.ico`)

  return {
    icon_png,
    icon_ico,
  }
}

export const LayoutViewer = forwardRef<DialogRef>((_, ref) => {
  const { t } = useTranslation()
  const { orbit, patchOrbit, mutateOrbit } = useOrbit()

  const [open, setOpen] = useState(false)
  const [commonIcon, setCommonIcon] = useState('')
  const [sysproxyIcon, setSysproxyIcon] = useState('')
  const [tunIcon, setTunIcon] = useState('')

  const { decorated, toggleDecorations } = useWindowDecorations()

  useEffect(() => {
    initIconPath()
  }, [])

  async function initIconPath() {
    const appDir = await getAppDir()

    const icon_dir = await join(appDir, 'icons')

    const { icon_png: common_icon_png, icon_ico: common_icon_ico } =
      await getIcons(icon_dir, 'common')

    const { icon_png: sysproxy_icon_png, icon_ico: sysproxy_icon_ico } =
      await getIcons(icon_dir, 'sysproxy')

    const { icon_png: tun_icon_png, icon_ico: tun_icon_ico } = await getIcons(
      icon_dir,
      'tun',
    )

    if (await exists(common_icon_ico)) {
      setCommonIcon(common_icon_ico)
    } else {
      setCommonIcon(common_icon_png)
    }
    if (await exists(sysproxy_icon_ico)) {
      setSysproxyIcon(sysproxy_icon_ico)
    } else {
      setSysproxyIcon(sysproxy_icon_png)
    }
    if (await exists(tun_icon_ico)) {
      setTunIcon(tun_icon_ico)
    } else {
      setTunIcon(tun_icon_png)
    }
  }

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }))

  const onSwitchFormat = (_e: any, value: boolean) => value
  const onError = (err: any) => {
    showNotice.error(err)
  }
  const onChangeData = (patch: Partial<IOrbitConfig>) => {
    mutateOrbit({ ...orbit, ...patch }, false)
  }

  return (
    <BaseDialog
      open={open}
      title={t('settings.components.orbit.layout.title')}
      contentSx={{ width: 450 }}
      disableOk
      cancelBtn={t('shared.actions.close')}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
    >
      <List>
        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.preferSystemTitlebar',
            )}
          />
          <GuardState
            value={decorated}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={async () => {
              await toggleDecorations()
            }}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t('settings.components.orbit.layout.fields.trafficGraph')}
          />
          <GuardState
            value={orbit?.traffic_graph ?? true}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) => onChangeData({ traffic_graph: e })}
            onGuard={(e) => patchOrbit({ traffic_graph: e })}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t('settings.components.orbit.layout.fields.memoryUsage')}
          />
          <GuardState
            value={orbit?.enable_memory_usage ?? true}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) => onChangeData({ enable_memory_usage: e })}
            onGuard={(e) => patchOrbit({ enable_memory_usage: e })}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.proxyGroupIcon',
            )}
          />
          <GuardState
            value={orbit?.enable_group_icon ?? true}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) => onChangeData({ enable_group_icon: e })}
            onGuard={(e) => patchOrbit({ enable_group_icon: e })}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.pauseRenderTrafficStatsOnBlur',
            )}
          />
          <GuardState
            value={orbit?.pause_render_traffic_stats_on_blur ?? true}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) =>
              onChangeData({ pause_render_traffic_stats_on_blur: e })
            }
            onGuard={(e) =>
              patchOrbit({ pause_render_traffic_stats_on_blur: e })
            }
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t('settings.components.orbit.layout.fields.toastPosition')}
          />
          <GuardState
            value={orbit?.notice_position ?? 'top-right'}
            onCatch={onError}
            onFormat={(e: any) => e.target.value}
            onChange={(value) => onChangeData({ notice_position: value })}
            onGuard={(value) => patchOrbit({ notice_position: value })}
          >
            <Select size="small" sx={{ width: 180, '> div': { py: '7.5px' } }}>
              <MenuItem value="top-right">
                {t(
                  'settings.components.orbit.layout.options.toastPosition.topRight',
                )}
              </MenuItem>
              <MenuItem value="top-left">
                {t(
                  'settings.components.orbit.layout.options.toastPosition.topLeft',
                )}
              </MenuItem>
              <MenuItem value="bottom-right">
                {t(
                  'settings.components.orbit.layout.options.toastPosition.bottomRight',
                )}
              </MenuItem>
              <MenuItem value="bottom-left">
                {t(
                  'settings.components.orbit.layout.options.toastPosition.bottomLeft',
                )}
              </MenuItem>
            </Select>
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>
                  {t('settings.components.orbit.layout.fields.hoverNavigator')}
                </span>
                <TooltipIcon
                  title={t(
                    'settings.components.orbit.layout.tooltips.hoverNavigator',
                  )}
                  sx={{ opacity: '0.7' }}
                />
              </Box>
            }
          />
          <GuardState
            value={orbit?.enable_hover_jump_navigator ?? true}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) => onChangeData({ enable_hover_jump_navigator: e })}
            onGuard={(e) => patchOrbit({ enable_hover_jump_navigator: e })}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>
                  {t(
                    'settings.components.orbit.layout.fields.hoverNavigatorDelay',
                  )}
                </span>
                <TooltipIcon
                  title={t(
                    'settings.components.orbit.layout.tooltips.hoverNavigatorDelay',
                  )}
                  sx={{ opacity: '0.7' }}
                />
              </Box>
            }
          />
          <GuardState
            value={orbit?.hover_jump_navigator_delay ?? DEFAULT_HOVER_DELAY}
            waitTime={400}
            onCatch={onError}
            onFormat={(e: any) => clampHoverDelay(Number(e.target.value))}
            onChange={(value) =>
              onChangeData({
                hover_jump_navigator_delay: clampHoverDelay(value),
              })
            }
            onGuard={(value) =>
              patchOrbit({ hover_jump_navigator_delay: clampHoverDelay(value) })
            }
          >
            <TextField
              type="number"
              size="small"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              sx={{ width: 120 }}
              disabled={!(orbit?.enable_hover_jump_navigator ?? true)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      {t('shared.units.milliseconds')}
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  min: 0,
                  max: 5000,
                  step: 20,
                },
              }}
            />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t('settings.components.orbit.layout.fields.navIcon')}
          />
          <GuardState
            value={orbit?.menu_icon ?? 'monochrome'}
            onCatch={onError}
            onFormat={(e: any) => e.target.value}
            onChange={(value) => onChangeData({ menu_icon: value })}
            onGuard={(value) => patchOrbit({ menu_icon: value })}
          >
            <Select size="small" sx={{ width: 140, '> div': { py: '7.5px' } }}>
              <MenuItem value="monochrome">
                {t('settings.components.orbit.layout.options.icon.monochrome')}
              </MenuItem>
              <MenuItem value="colorful">
                {t('settings.components.orbit.layout.options.icon.colorful')}
              </MenuItem>
              <MenuItem value="disable">
                {t('settings.components.orbit.layout.options.icon.disable')}
              </MenuItem>
            </Select>
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.collapseNavBar',
            )}
          />
          <GuardState
            value={orbit?.collapse_navbar ?? false}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) => onChangeData({ collapse_navbar: e })}
            onGuard={(e) => patchOrbit({ collapse_navbar: e })}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        {OS === 'macos' && (
          <Item>
            <ListItemText
              primary={t('settings.components.orbit.layout.fields.trayIcon')}
            />
            <GuardState
              value={orbit?.tray_icon ?? 'monochrome'}
              onCatch={onError}
              onFormat={(e: any) => e.target.value}
              onChange={(e) => onChangeData({ tray_icon: e })}
              onGuard={(e) => patchOrbit({ tray_icon: e })}
            >
              <Select
                size="small"
                sx={{ width: 140, '> div': { py: '7.5px' } }}
              >
                <MenuItem value="monochrome">
                  {t(
                    'settings.components.orbit.layout.options.icon.monochrome',
                  )}
                </MenuItem>
                <MenuItem value="colorful">
                  {t('settings.components.orbit.layout.options.icon.colorful')}
                </MenuItem>
              </Select>
            </GuardState>
          </Item>
        )}
        {OS === 'macos' && (
          <Item>
            <ListItemText
              primary={t(
                'settings.components.orbit.layout.fields.enableTraySpeed',
              )}
            />
            <GuardState
              value={orbit?.enable_tray_speed ?? false}
              valueProps="checked"
              onCatch={onError}
              onFormat={onSwitchFormat}
              onChange={(e) => onChangeData({ enable_tray_speed: e })}
              onGuard={(e) => patchOrbit({ enable_tray_speed: e })}
            >
              <Switch edge="end" />
            </GuardState>
          </Item>
        )}
        {/* {OS === "macos" && (
          <Item>
            <ListItemText primary={t("settings.components.orbit.layout.fields.enableTrayIcon")} />
            <GuardState
              value={
                orbit?.enable_tray_icon === false &&
                orbit?.enable_tray_speed === false
                  ? true
                  : (orbit?.enable_tray_icon ?? true)
              }
              valueProps="checked"
              onCatch={onError}
              onFormat={onSwitchFormat}
              onChange={(e) => onChangeData({ enable_tray_icon: e })}
              onGuard={(e) => patchOrbit({ enable_tray_icon: e })}
            >
              <Switch edge="end" />
            </GuardState>
          </Item>
        )} */}
        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.proxyGroupsDisplayMode',
            )}
          />
          <GuardState
            value={orbit?.tray_proxy_groups_display_mode ?? 'default'}
            onCatch={onError}
            onFormat={(e: any) => e.target.value}
            onChange={(value) =>
              onChangeData({ tray_proxy_groups_display_mode: value })
            }
            onGuard={(value) =>
              patchOrbit({ tray_proxy_groups_display_mode: value })
            }
          >
            <Select size="small" sx={{ width: 140, '> div': { py: '7.5px' } }}>
              <MenuItem value="default">
                {t(
                  'settings.components.orbit.layout.options.proxyGroupsDisplayMode.default',
                )}
              </MenuItem>
              <MenuItem value="inline">
                {t(
                  'settings.components.orbit.layout.options.proxyGroupsDisplayMode.inline',
                )}
              </MenuItem>
              <MenuItem value="disable">
                {t(
                  'settings.components.orbit.layout.options.proxyGroupsDisplayMode.disable',
                )}
              </MenuItem>
            </Select>
          </GuardState>
        </Item>
        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.showOutboundModesInline',
            )}
          />
          <GuardState
            value={orbit?.tray_inline_outbound_modes ?? false}
            valueProps="checked"
            onCatch={onError}
            onFormat={onSwitchFormat}
            onChange={(e) => onChangeData({ tray_inline_outbound_modes: e })}
            onGuard={(e) => patchOrbit({ tray_inline_outbound_modes: e })}
          >
            <Switch edge="end" />
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.commonTrayIcon',
            )}
          />
          <GuardState
            value={orbit?.common_tray_icon}
            onCatch={onError}
            onChange={(e) => onChangeData({ common_tray_icon: e })}
            onGuard={(e) => patchOrbit({ common_tray_icon: e })}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                orbit?.common_tray_icon &&
                commonIcon && (
                  <img height="20px" src={convertFileSrc(commonIcon)} />
                )
              }
              onClick={async () => {
                if (orbit?.common_tray_icon) {
                  onChangeData({ common_tray_icon: false })
                  patchOrbit({ common_tray_icon: false })
                } else {
                  const selected = await openDialog({
                    directory: false,
                    multiple: false,
                    filters: [
                      {
                        name: 'Tray Icon Image',
                        extensions: ['png', 'ico'],
                      },
                    ],
                  })

                  if (selected) {
                    await copyIconFile(`${selected}`, 'common')
                    await initIconPath()
                    onChangeData({ common_tray_icon: true })
                    patchOrbit({ common_tray_icon: true })
                  }
                }
              }}
            >
              {orbit?.common_tray_icon
                ? t('shared.actions.clear')
                : t('settings.components.orbit.basic.actions.browse')}
            </Button>
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t(
              'settings.components.orbit.layout.fields.systemProxyTrayIcon',
            )}
          />
          <GuardState
            value={orbit?.sysproxy_tray_icon}
            onCatch={onError}
            onChange={(e) => onChangeData({ sysproxy_tray_icon: e })}
            onGuard={(e) => patchOrbit({ sysproxy_tray_icon: e })}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                orbit?.sysproxy_tray_icon &&
                sysproxyIcon && (
                  <img height="20px" src={convertFileSrc(sysproxyIcon)} />
                )
              }
              onClick={async () => {
                if (orbit?.sysproxy_tray_icon) {
                  onChangeData({ sysproxy_tray_icon: false })
                  patchOrbit({ sysproxy_tray_icon: false })
                } else {
                  const selected = await openDialog({
                    directory: false,
                    multiple: false,
                    filters: [
                      {
                        name: 'Tray Icon Image',
                        extensions: ['png', 'ico'],
                      },
                    ],
                  })
                  if (selected) {
                    await copyIconFile(`${selected}`, 'sysproxy')
                    await initIconPath()
                    onChangeData({ sysproxy_tray_icon: true })
                    patchOrbit({ sysproxy_tray_icon: true })
                  }
                }
              }}
            >
              {orbit?.sysproxy_tray_icon
                ? t('shared.actions.clear')
                : t('settings.components.orbit.basic.actions.browse')}
            </Button>
          </GuardState>
        </Item>

        <Item>
          <ListItemText
            primary={t('settings.components.orbit.layout.fields.tunTrayIcon')}
          />
          <GuardState
            value={orbit?.tun_tray_icon}
            onCatch={onError}
            onChange={(e) => onChangeData({ tun_tray_icon: e })}
            onGuard={(e) => patchOrbit({ tun_tray_icon: e })}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={
                orbit?.tun_tray_icon &&
                tunIcon && <img height="20px" src={convertFileSrc(tunIcon)} />
              }
              onClick={async () => {
                if (orbit?.tun_tray_icon) {
                  onChangeData({ tun_tray_icon: false })
                  patchOrbit({ tun_tray_icon: false })
                } else {
                  const selected = await openDialog({
                    directory: false,
                    multiple: false,
                    filters: [
                      {
                        name: 'Tun Icon Image',
                        extensions: ['png', 'ico'],
                      },
                    ],
                  })
                  if (selected) {
                    await copyIconFile(`${selected}`, 'tun')
                    await initIconPath()
                    onChangeData({ tun_tray_icon: true })
                    patchOrbit({ tun_tray_icon: true })
                  }
                }
              }}
            >
              {orbit?.tun_tray_icon
                ? t('shared.actions.clear')
                : t('settings.components.orbit.basic.actions.browse')}
            </Button>
          </GuardState>
        </Item>
      </List>
    </BaseDialog>
  )
})

const Item = styled(ListItem)(() => ({
  padding: '5px 2px',
}))
