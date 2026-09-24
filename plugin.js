/**
 * Claude skin — makes Hermes Desktop read like the Claude desktop app.
 *
 * Two halves:
 *   1. A `claude` theme (light + dark, follows macOS appearance) registered
 *      through the THEMES_AREA contribution, so it shows up in
 *      Settings ▸ Appearance next to the built-ins.
 *   2. A layout stylesheet, scoped to `html[data-hermes-theme="claude"]`, so
 *      picking any other theme puts the stock Hermes layout back untouched.
 *
 * Nothing here edits app source — disable the plugin in Capabilities ▸ Plugins
 * (or pick another theme) and Hermes is exactly what it was.
 *
 * Repo:    https://github.com/ottoRothmund/hermes-claude-skin
 * Contact: https://x.com/djbumpstock
 */

import * as sdk from '@hermes/plugin-sdk'
import { jsx } from 'react/jsx-runtime'
import { useEffect } from 'react'

const { THEMES_AREA, TITLEBAR_AREAS, PALETTE_AREA, host, requestTheme, useTheme, useValue } = sdk

/** Same rule as the desktop's own profile keys: blank means `default`. */
const profileKey = name => (name ?? '').trim() || 'default'

const PLUGIN_ID = 'claude-skin'
const THEME_NAME = 'claude'
const STYLE_ID = 'claude-skin-style'

/** Optional name for the empty-state greeting: '' → "Good evening", 'Ada' → "Good evening, Ada". */
const GREETING_NAME = ''

// ── Palette ─────────────────────────────────────────────────────────────────
// Claude's warm neutrals + terracotta. Light = cream, dark = warm charcoal.

const SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Segoe UI", system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"'
const MONO = '"SF Mono", Menlo, Monaco, "JetBrains Mono", "Fira Code", monospace'

const light = {
  background: '#FAF9F5',
  foreground: '#141413',
  card: '#FFFFFF',
  cardForeground: '#141413',
  muted: '#F0EEE6',
  mutedForeground: '#6E6C64',
  popover: '#FFFFFF',
  popoverForeground: '#141413',
  primary: '#C96442',
  primaryForeground: '#FFFFFF',
  secondary: '#F0EEE6',
  secondaryForeground: '#3D3929',
  accent: '#F0EEE6',
  accentForeground: '#141413',
  border: '#E5E3DA',
  input: '#E5E3DA',
  ring: '#C96442',
  midground: '#C96442',
  composerRing: '#D6D3C8',
  destructive: '#B3261E',
  destructiveForeground: '#FFFFFF',
  sidebarBackground: '#F1EFE8',
  sidebarBorder: '#E5E3DA',
  userBubble: '#F0EEE6',
  userBubbleBorder: 'transparent'
}

// Dark = the Claude desktop app's Code tab: neutral near-black, a one-step
// lighter sidebar divider, warm off-white text.
const dark = {
  background: '#151515',
  foreground: '#F0EFEC',
  card: '#1F1F1F',
  cardForeground: '#F0EFEC',
  muted: '#2A2A2A',
  mutedForeground: '#898782',
  popover: '#1F1F1F',
  popoverForeground: '#F0EFEC',
  primary: '#D97757',
  primaryForeground: '#FFFFFF',
  secondary: '#2A2A2A',
  secondaryForeground: '#E5E4DF',
  accent: '#2A2A2A',
  accentForeground: '#F0EFEC',
  border: '#292929',
  input: '#292929',
  ring: '#D97757',
  midground: '#D97757',
  composerRing: '#333333',
  destructive: '#E5484D',
  destructiveForeground: '#FFFFFF',
  sidebarBackground: '#111111',
  sidebarBorder: '#292929',
  userBubble: '#262626',
  userBubbleBorder: 'transparent'
}

const theme = {
  name: THEME_NAME,
  label: 'Claude',
  description: 'Claude desktop — cream light, near-black dark, terracotta accent',
  colors: light,
  darkColors: dark,
  typography: { fontSans: SANS, fontMono: MONO },
  terminal: {
    foreground: '#3D3929',
    black: '#141413',
    red: '#B3261E',
    green: '#2F7D4F',
    yellow: '#9A6B1F',
    blue: '#3B6FA0',
    magenta: '#8C5A9E',
    cyan: '#2F7F8A',
    white: '#87867F',
    brightBlack: '#6E6C64',
    brightRed: '#C96442',
    brightGreen: '#3E9A63',
    brightYellow: '#B8862B',
    brightBlue: '#4E86BD',
    brightMagenta: '#A47AB8',
    brightCyan: '#3E98A6',
    brightWhite: '#3D3929'
  },
  darkTerminal: {
    foreground: '#E5E4DF',
    black: '#393937',
    red: '#E5484D',
    green: '#6CBF83',
    yellow: '#D9A94A',
    blue: '#7FA9D6',
    magenta: '#BC9AD1',
    cyan: '#6FC0CC',
    white: '#C2C0B6',
    brightBlack: '#6E6C64',
    brightRed: '#D97757',
    brightGreen: '#86D39C',
    brightYellow: '#E6BE63',
    brightBlue: '#9BBFE6',
    brightMagenta: '#CDB0E0',
    brightCyan: '#8AD3DD',
    brightWhite: '#F1F0EA'
  }
}


// ── More palettes, same Claude layout ───────────────────────────────────────
// Each entry is [slug, label, description, light, dark, typography?]. Palettes
// only name the handful of colors that matter; `expand` fills the rest.

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
const inkOn = hex => (luminance(hex) > 0.42 ? '#141414' : '#FFFFFF')

function expand(p) {
  return {
    background: p.bg,
    foreground: p.fg,
    card: p.card,
    cardForeground: p.fg,
    muted: p.bubble,
    mutedForeground: p.muted,
    popover: p.card,
    popoverForeground: p.fg,
    primary: p.primary,
    primaryForeground: inkOn(p.primary),
    secondary: p.bubble,
    secondaryForeground: p.fg,
    accent: p.bubble,
    accentForeground: p.fg,
    border: p.border,
    input: p.border,
    ring: p.primary,
    midground: p.primary,
    composerRing: p.border,
    destructive: p.danger || '#E5484D',
    destructiveForeground: '#FFFFFF',
    sidebarBackground: p.sidebar,
    sidebarBorder: p.border,
    userBubble: p.bubble,
    userBubbleBorder: 'transparent'
  }
}

// Dark-only editor themes use one palette in both modes.
const darkOnly = p => [p, p]

// One Dark Pro and One Candy Dark share Atom's One Dark chrome.
const ONE_DARK = { bg: '#282C34', sidebar: '#21252B', card: '#2C313A', bubble: '#3E4452', fg: '#ABB2BF', muted: '#7F848E', border: '#3E4452' }

// Order here is the order in Settings ▸ Appearance.
const PALETTES = [
  ['mac', 'MacOS', 'System greys, system blue',
    { bg: '#FFFFFF', sidebar: '#F5F5F7', card: '#FFFFFF', bubble: '#F0F0F3', fg: '#1D1D1F', muted: '#6E6E73', border: '#E3E3E8', primary: '#007AFF' },
    { bg: '#1E1E1E', sidebar: '#262626', card: '#2C2C2E', bubble: '#2F2F31', fg: '#F5F5F7', muted: '#98989D', border: '#3A3A3C', primary: '#0A84FF' }],
  ['nord', 'Nord', 'Arctic blues — Snow Storm / Polar Night',
    { bg: '#ECEFF4', sidebar: '#E5E9F0', card: '#FFFFFF', bubble: '#E5E9F0', fg: '#2E3440', muted: '#4C566A', border: '#D8DEE9', primary: '#5E81AC', danger: '#BF616A' },
    { bg: '#2E3440', sidebar: '#272C36', card: '#3B4252', bubble: '#3B4252', fg: '#ECEFF4', muted: '#9AA3B5', border: '#434C5E', primary: '#88C0D0', danger: '#BF616A' }],
  ['gruvbox', 'Gruvbox', 'Retro groove — warm browns, orange accent',
    { bg: '#FBF1C7', sidebar: '#F2E5BC', card: '#F9F5D7', bubble: '#EBDBB2', fg: '#3C3836', muted: '#7C6F64', border: '#D5C4A1', primary: '#AF3A03', danger: '#9D0006' },
    { bg: '#282828', sidebar: '#1D2021', card: '#32302F', bubble: '#3C3836', fg: '#EBDBB2', muted: '#A89984', border: '#3C3836', primary: '#FE8019', danger: '#FB4934' }],
  ['monokai-pro', 'Monokai Pro', 'Monokai Pro filter — dusk grey, sunset accents',
    ...darkOnly({ bg: '#2D2A2E', sidebar: '#221F22', card: '#363437', bubble: '#403E41', fg: '#FCFCFA', muted: '#939293', border: '#403E41', primary: '#FFD866', danger: '#FF6188' })],
  ['one-monokai', 'One Monokai', 'Monokai colors on the One Dark base',
    ...darkOnly({ bg: '#282C34', sidebar: '#21252B', card: '#2F333D', bubble: '#383E4A', fg: '#ABB2BF', muted: '#676F7D', border: '#3E4451', primary: '#98C379', danger: '#E06C75' })],
  ['dracula', 'Dracula', 'Alucard / Dracula — purple and pink',
    { bg: '#FFFBEB', sidebar: '#F4EFD8', card: '#FFFFFF', bubble: '#EFEBD6', fg: '#1F1F1F', muted: '#6C664B', border: '#DEDAC5', primary: '#644AC9', danger: '#CB3A2A' },
    { bg: '#282A36', sidebar: '#21222C', card: '#343746', bubble: '#44475A', fg: '#F8F8F2', muted: '#9AA0C0', border: '#44475A', primary: '#BD93F9', danger: '#FF5555' }],
  ['one-dark-pro', 'One Dark Pro', "Atom's One Dark, Pro edition",
    ...darkOnly({ ...ONE_DARK, primary: '#61AFEF', danger: '#E06C75' })],
  ['one-candy-dark', 'One Candy Dark', 'One Dark chrome, candy-pastel accent',
    ...darkOnly({ ...ONE_DARK, primary: '#FCADE7', danger: '#E06C75' })],
  ['cobalt2', 'Cobalt2', "Wes Bos's deep cobalt, yellow accent",
    ...darkOnly({ bg: '#193549', sidebar: '#15232D', card: '#1F4662', bubble: '#1F4662', fg: '#FFFFFF', muted: '#AAAAAA', border: '#1F4662', primary: '#FFC600', danger: '#F44542' })],
  ['github', 'GitHub', 'GitHub Light / Dark Default',
    { bg: '#FFFFFF', sidebar: '#F6F8FA', card: '#FFFFFF', bubble: '#F6F8FA', fg: '#1F2328', muted: '#656D76', border: '#D0D7DE', primary: '#0969DA', danger: '#CF222E' },
    { bg: '#0D1117', sidebar: '#010409', card: '#161B22', bubble: '#21262D', fg: '#E6EDF3', muted: '#8B949E', border: '#30363D', primary: '#2F81F7', danger: '#F85149' }],
  ['ayu', 'Ayu', 'Ayu Light / Dark — warm accent on cool greys',
    { bg: '#FCFCFC', sidebar: '#F8F9FA', card: '#FFFFFF', bubble: '#F3F4F5', fg: '#5C6166', muted: '#828E9F', border: '#E9EBED', primary: '#F29718', danger: '#E65050' },
    { bg: '#10141C', sidebar: '#0D1017', card: '#141821', bubble: '#1B1F29', fg: '#BFBDB6', muted: '#707A8C', border: '#1B1F29', primary: '#E6B450', danger: '#D95757' }]
]

const EXTRA_THEMES = PALETTES.map(([slug, label, description, lightP, darkP, typography]) => ({
  name: `${THEME_NAME}-${slug}`,
  label: `Claude - ${label}`,
  description: `${description} (Claude layout)`,
  colors: expand(lightP),
  darkColors: expand(darkP),
  typography: typography || { fontSans: SANS, fontMono: MONO }
}))

// ── Layout stylesheet ───────────────────────────────────────────────────────
// Everything is scoped to the active theme so it switches off with it.

const S = 'html[data-hermes-theme^="claude"]'

const CSS = `
/* ── tokens ─────────────────────────────────────────────────────────────── */
${S} {
  /* Paint the seeds as-is (Hermes normally blends them toward a neutral). */
  --theme-mix-chrome: 100% !important;
  --theme-mix-sidebar: 100% !important;
  --theme-mix-card: 100% !important;
  --theme-mix-elevated: 100% !important;
  --theme-mix-bubble: 100% !important;
  /* Neutral (untinted) hovers, fills and hairlines — Claude keeps the
     terracotta for actions only. */
  --theme-fill-primary-accent-mix: 0%;
  --theme-fill-secondary-accent-mix: 0%;
  --theme-fill-tertiary-accent-mix: 0%;
  --theme-fill-quaternary-accent-mix: 0%;
  --theme-fill-quinary-accent-mix: 0%;
  --theme-stroke-primary-accent-mix: 0%;
  --theme-stroke-secondary-accent-mix: 0%;
  --theme-stroke-tertiary-accent-mix: 0%;
  --theme-stroke-quaternary-accent-mix: 0%;
  --theme-row-hover-accent-mix: 0%;
  --theme-row-active-accent-mix: 0%;
  --theme-control-hover-accent-mix: 0%;
  --theme-control-active-accent-mix: 0%;
  /* Opaque, flat surfaces. */
  --translucency-glass-keep: 100% !important;
  --noise-opacity-mul: 0 !important;
  /* Claude is round. */
  --radius-scalar: 1;
  --dt-input-border: 14%;
  --dt-input-inset: none;
  /* Reading column + type. */
  --composer-width: 48rem;
  --conversation-text-font-size: 0.9375rem;
  --conversation-line-height: 1.55rem;
  --dt-line-height: 1.65;
  --conversation-caption-font-size: 0.8125rem;
  --conversation-tool-font-size: 0.75rem;
  --conversation-caption-line-height: 1.125rem;
  --paragraph-gap: 0.95rem;
  --conversation-turn-gap: 1.5rem;
  --turn-block-gap: 1rem;
  --message-text-indent: 0;
  --sticky-human-top: 0.5rem;
  /* Composer proportions. */
  --composer-surface-pad-x: 0.875rem;
  --composer-surface-pad-y: 0.75rem;
  --composer-input-min-height: 2.25rem;
  --composer-input-max-height: 16rem;
  --composer-control-size: 1.75rem;
  --composer-control-primary-size: 2rem;
  --composer-control-gap: 0.375rem;
  --composer-row-gap: 0.5rem;
  --composer-shell-pad-block-end: 1.25rem;
  --claude-font-serif: "Charter", "Iowan Old Style", "Source Serif 4", "Georgia", "Times New Roman", serif;
}
${S} .dark, ${S}.dark {
  --ui-inline-code-background: color-mix(in srgb, #ffffff 8%, transparent);
  --ui-inline-code-foreground: color-mix(in srgb, #ffffff 90%, transparent);
}

/* ── chrome: no status bar, no texture, quiet titlebar ───────────────────── */
${S} footer[data-slot="statusbar"] { border-top: 1px solid var(--ui-stroke-tertiary); }
${S} [data-chat-surface] > div[aria-hidden="true"]:has(> img) { display: none !important; }
${S} [data-titlebar-cluster] button { opacity: 0.55; }
${S} [data-titlebar-cluster] button:hover { opacity: 1; }

/* Main pane tab strip → a plain conversation title, Claude style. */
${S} [data-zone-tabstrip="grp-main"] { background: transparent !important; }
${S} [data-zone-tabstrip="grp-main"] [role="tab"] {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}
${S} [data-zone-tabstrip="grp-main"] [role="tab"] .uppercase {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ui-text-secondary);
}
${S} [data-zone-tabstrip="grp-main"] [role="tab"][aria-selected="true"] .uppercase { color: var(--ui-text-primary); }
${S} [data-tree-group="grp-main"] > [data-panel-header] { background: transparent !important; }

/* Sidebar pane header: drag band on top, then the Sessions/Bots/Terminal tabs
   as Claude's "Home | Code" segmented control — a pill track one step
   lighter than the sidebar, a flat lighter thumb, no hairline or shadow. */
${S} [data-tree-group="grp-sessions"] > [data-panel-header] { height: 87px !important; background: transparent !important; }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] {
  position: absolute; left: 0.625rem; right: 0.625rem; top: 50px; height: 31px;
  display: flex;
  background: var(--claude-seg-track) !important;
  border-radius: 0.625rem;
  padding: 2px;
  cursor: default !important;
}
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] [role="tablist"] { display: flex; width: 100%; gap: 2px; overflow: hidden; }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] [role="tab"] {
  flex: 1 1 0; min-width: 0;
  height: 27px;
  justify-content: center;
  border-radius: 0.5rem;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--dt-muted-foreground);
  cursor: pointer !important;
  transition: background-color 120ms, color 120ms;
}
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] [role="tab"]:hover { color: var(--dt-foreground); }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] [role="tab"][aria-selected="true"] {
  background: var(--claude-seg-thumb) !important;
  color: var(--dt-foreground);
}
/* Kill the strip's own chrome: active underline, status dot, key hints. */
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] [role="tab"]::before,
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] [role="tab"]::after { display: none !important; }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] .tab-key-hint-icon { display: none !important; }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] .pane-tab-content { justify-content: center; }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] .pane-tab-content > span:last-child { justify-content: center; padding: 0 0.25rem; }
/* Icon and label are rebuilt as pseudo-elements so the gap between them is ours. */
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] .uppercase {
  display: inline-flex; align-items: center; gap: 0.5rem;
  text-transform: none; letter-spacing: 0; font-size: 0 !important;
  overflow: hidden;
}
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] .uppercase::before { font-family: codicon; font-size: 0.875rem; line-height: 1; }
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] .uppercase::after {
  font-family: var(--dt-font-sans); font-size: 0.875rem; line-height: 1; font-weight: 500;
  white-space: nowrap;
}
${S} [data-zone-tabstrip="grp-sessions"] [data-tree-tab="sessions"] .uppercase::before { content: "\\eb06"; }
${S} [data-zone-tabstrip="grp-sessions"] [data-tree-tab="sessions"] .uppercase::after { content: "Home"; }
${S} [data-zone-tabstrip="grp-sessions"] [data-tree-tab="hermes-bots:pane"] .uppercase::before { content: "\\ec20"; }
${S} [data-zone-tabstrip="grp-sessions"] [data-tree-tab="hermes-bots:pane"] .uppercase::after { content: "Bots"; }
${S} [data-zone-tabstrip="grp-sessions"] [data-tree-tab="terminal"] .uppercase::before { content: "\\ea85"; }
${S} [data-zone-tabstrip="grp-sessions"] [data-tree-tab="terminal"] .uppercase::after { content: "Terminal"; }
/* Three tabs: a tighter icon gap, and in a narrow sidebar smaller type too,
   so "Terminal" fits whole (the strip is a size container for the query). */
${S} [data-tree-group="grp-sessions"] [data-zone-tabstrip] { container-type: inline-size; }
${S} [data-zone-tabstrip="grp-sessions"]:has([role="tab"]:nth-child(3)) .uppercase { gap: 0.375rem; }
${S} [data-zone-tabstrip="grp-sessions"]:has([role="tab"]:nth-child(3)) .pane-tab-content > span:last-child { padding: 0; }
@container (max-width: 250px) {
  ${S} [data-zone-tabstrip="grp-sessions"]:has([role="tab"]:nth-child(3)) .uppercase { gap: 0.25rem; }
  ${S} [data-zone-tabstrip="grp-sessions"]:has([role="tab"]:nth-child(3)) .uppercase::before,
  ${S} [data-zone-tabstrip="grp-sessions"]:has([role="tab"]:nth-child(3)) .uppercase::after { font-size: 0.75rem; }
}
${S} [data-zone-tabstrip="grp-sessions"] [aria-label="Minimize"] { display: none; }
${S} [data-zone-tabstrip="grp-sessions"] [aria-label="Close"] { display: none; }
${S} {
  --claude-seg-track: color-mix(in srgb, #000 5%, var(--dt-sidebar-bg));
  --claude-seg-thumb: var(--dt-card);
  --claude-row-hover: color-mix(in srgb, #000 6%, var(--dt-sidebar-bg));
  --claude-nav-fg: color-mix(in srgb, var(--dt-foreground) 80%, var(--dt-sidebar-bg));
}
${S}.dark {
  --claude-seg-track: color-mix(in srgb, #fff 6%, var(--dt-sidebar-bg));
  --claude-seg-thumb: color-mix(in srgb, #fff 15%, var(--dt-sidebar-bg));
  --claude-row-hover: color-mix(in srgb, #fff 14%, var(--dt-sidebar-bg));
}

/* Claude's short nav labels. Capabilities is Claude's "Customize" (skills,
   plugins, connectors); the tooltip keeps Hermes's own name. */
${S} [data-tour="sidebar-nav-new-session"],
${S} [data-tour="sidebar-nav-capabilities"],
${S} [data-tour="sidebar-nav-cron"] { font-size: 0 !important; }
${S} [data-tour="sidebar-nav-new-session"]::after { content: "New"; font-size: 0.875rem; }
${S} [data-tour="sidebar-nav-capabilities"]::after { content: "Customize"; font-size: 0.875rem; }
${S} [data-tour="sidebar-nav-cron"]::after { content: "Scheduled"; font-size: 0.875rem; }

/* Search lives behind the titlebar magnifier; the field only opens while in use. */
${S} [data-slot="sidebar-content"] > div:has(input[aria-label="Search sessions"]):not(:has(input:focus)):not(:has(input:not(:placeholder-shown))) {
  height: 0; padding-top: 0; padding-bottom: 0; overflow: hidden;
}
${S} #claude-skin-search {
  display: inline-grid; place-items: center;
  width: 24px; height: 24px; margin-left: 2px;
  border-radius: 4px; background: transparent; border: 0;
  color: inherit; opacity: 0.55; cursor: pointer;
}
${S} #claude-skin-search:hover { opacity: 1; background: var(--chrome-action-hover); }
html:not([data-hermes-theme^="claude"]) #claude-skin-search { display: none; }

/* ── sidebar ─────────────────────────────────────────────────────────────── */
${S} [data-slot="sidebar"] { border-right-color: var(--dt-sidebar-border) !important; }
${S} [data-slot="sidebar-content"] { padding-left: 0.625rem; padding-right: 0.625rem; }
${S} [data-sidebar="menu"] { gap: 1px; }
${S} [data-sidebar="menu-button"] {
  height: 1.75rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  gap: 0.5rem;
  border-radius: 0.5rem;
  border-color: transparent !important;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--claude-nav-fg);
}
/* Icons carry the label's colour at full strength, like Claude's. */
${S} [data-sidebar="menu-button"] > i { color: inherit !important; opacity: 1; font-size: 0.875rem; width: 1rem; text-align: center; }
${S} [data-sidebar="menu-button"] [data-slot="kbd-group"] { display: none; }
${S} [data-sidebar="menu-button"]:hover,
${S} [data-sidebar="menu-button"].bg-\\(--ui-control-active-background\\) {
  background: var(--claude-row-hover);
  color: var(--dt-foreground);
}
/* "New session" → "New" with a plain plus; Capabilities gets Claude's briefcase. */
${S} [data-sidebar="menu-item"]:first-child [data-sidebar="menu-button"] > i::before { content: "\\ea60"; } /* codicon-add */
${S} [data-sidebar="menu-button"]:has([data-tour="sidebar-nav-capabilities"]) > i::before { content: "\\eaac"; } /* codicon-briefcase */

/* "More": New, Artifacts and Customize stay out; every other nav row folds
   under a chevron row like Claude's. The row is injected by register() and
   the open state lives on <html> (remembered in plugin storage). */
${S} ul[data-sidebar="menu"]:has(> [data-claude-more]) > li { order: 4; }
${S} ul[data-sidebar="menu"]:has(> [data-claude-more]) > li:has([data-tour="sidebar-nav-new-session"]) { order: 0; }
${S} ul[data-sidebar="menu"]:has(> [data-claude-more]) > li:has([data-tour="sidebar-nav-artifacts"]) { order: 1; }
${S} ul[data-sidebar="menu"]:has(> [data-claude-more]) > li:has([data-tour="sidebar-nav-capabilities"]) { order: 2; }
${S} ul[data-sidebar="menu"]:has(> [data-claude-more]) > li[data-claude-more] { order: 3; }
${S}:not([data-claude-nav-more]) ul[data-sidebar="menu"]:has(> [data-claude-more]) > li:not([data-claude-more]):not(:has([data-tour="sidebar-nav-new-session"], [data-tour="sidebar-nav-artifacts"], [data-tour="sidebar-nav-capabilities"])) { display: none; }
/* Nothing to fold → no row. */
${S} ul[data-sidebar="menu"]:not(:has(> li:not([data-claude-more]):not(:has([data-tour="sidebar-nav-new-session"], [data-tour="sidebar-nav-artifacts"], [data-tour="sidebar-nav-capabilities"])))) > [data-claude-more] { display: none; }
html:not([data-hermes-theme^="claude"]) [data-claude-more] { display: none; }
${S} [data-claude-more] > button {
  display: flex; align-items: center; width: 100%;
  background: transparent; border: 0; cursor: pointer; font: inherit;
  color: var(--dt-muted-foreground);
}
${S} [data-claude-more] > button > i { opacity: 0.7; transition: transform 120ms; }
${S}[data-claude-nav-more] [data-claude-more] > button > i { transform: rotate(180deg); }
${S} [data-claude-more] > button > span::after { content: "More"; }
${S}[data-claude-nav-more] [data-claude-more] > button > span::after { content: "Less"; }

/* Section labels ("Pinned", "Sessions") → quiet, sentence case, muted. */
${S} .group\\/section-label > span {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--dt-muted-foreground);
  padding-left: 0.5rem;
}
${S} .group\\/section-label .dither { display: none; }
${S} .group\\/section { padding-top: 1.125rem; padding-bottom: 0.25rem; }

/* Date group headers ("Earlier today"). */
${S} .group\\/workspace .uppercase { text-transform: none; letter-spacing: 0; font-size: 0.6875rem; font-weight: 500; }
${S} .group\\/workspace .h-px { display: none; }

/* Session rows: taller, flush text, no timestamps or drag dots. */
${S} [data-slot="row-button"] { padding-left: 0.5rem; }
${S} [data-slot="row-button"] [data-reorder-handle] { display: none; }
${S} [data-slot="row-button"] .hover-marquee { font-size: 0.875rem; color: var(--claude-nav-fg); }
${S} .row-hover { min-height: 1.75rem; border-radius: 0.5rem; }
${S} .row-hover:hover { background: var(--claude-row-hover); }
${S} .row-hover:hover .hover-marquee { color: var(--dt-foreground); }
${S} .session-row-tail { display: none; }
${S} [data-row-actions] > span > span.pointer-events-none { display: none; }

/* Sidebar search sits like Claude's: quiet until used. */
${S} input[aria-label="Search sessions"] { font-size: 0.8125rem; }

/* ── transcript ──────────────────────────────────────────────────────────── */
${S} [data-slot="aui_thread-content"] { padding-left: 1.5rem; padding-right: 1.5rem; }

/* User turn: a soft bubble that hugs its text, on the right. */
${S} [data-slot="aui_user-message-root"] { align-items: flex-end; }
${S} [data-slot="aui_user-bubble-actions"] { width: auto; max-width: 80%; }
${S} .composer-human-message {
  border-radius: 1.125rem !important;
  border-color: transparent !important;
  padding: 0.625rem 1rem !important;
  box-shadow: none !important;
  font-size: var(--conversation-text-font-size);
  line-height: var(--conversation-line-height);
}

/* Assistant turn: plain text, full column, generous rhythm. */
${S} [data-slot="aui_assistant-message-content"] { font-family: var(--dt-font-sans); }
${S} .aui-md.prose { padding-left: 0; }
${S} .aui-md.prose h1, ${S} .aui-md.prose h2, ${S} .aui-md.prose h3 {
  font-family: var(--dt-font-sans);
  font-weight: 600;
  letter-spacing: -0.01em;
}
${S} .aui-md.prose pre, ${S} .aui-md.prose [data-slot="code-card"] { border-radius: 0.75rem; }
${S} .aui-md.prose code { border-radius: 0.375rem; font-size: 0.85em; }
${S} .aui-md.prose table { border-radius: 0.5rem; }
${S} [data-slot="aui_thinking-disclosure"] { margin-bottom: 0.25rem; }

/* Timeline rail: keep, but fade until hovered. */
${S} [data-slot="thread-timeline"] { opacity: 0.35; transition: opacity 120ms; }
${S} [data-slot="thread-timeline"]:hover { opacity: 1; }

/* ── composer ────────────────────────────────────────────────────────────── */
${S} form[data-slot="composer-root"] { border-radius: 1.25rem; }
${S} [data-slot="composer-surface"] {
  border-radius: 1.25rem !important;
  border-color: var(--dt-composer-ring) !important;
  box-shadow: 0 2px 10px color-mix(in srgb, #000 6%, transparent), 0 0 0 0 transparent;
  --composer-fill: var(--dt-card);
}
${S}.dark [data-slot="composer-surface"] { box-shadow: 0 2px 12px color-mix(in srgb, #000 30%, transparent); }
/* Two rows: the text on top, controls underneath (+ left, model/send right). */
${S} [data-slot="composer-fade"] > .grid {
  grid-template-columns: auto minmax(0, 1fr) auto !important;
  grid-template-areas: "input input input" "menu spacer controls" !important;
  row-gap: 0.375rem;
}
${S} [data-slot="composer-fade"] > .grid > [class*="grid-area:menu"] { transform: none !important; align-self: center; }
${S} [data-slot="composer-rich-input"] {
  font-size: 0.9375rem;
  line-height: 1.5rem;
  padding: 0.125rem 0.125rem;
}
${S} [data-slot="composer-rich-input"][data-empty]::before { color: var(--ui-text-tertiary); }
/* Send = terracotta. */
${S} form[data-slot="composer-root"] button[type="submit"],
${S} form[data-slot="composer-root"] button[data-variant="default"][data-size="icon"] {
  border-radius: 0.625rem !important;
  background: var(--dt-primary) !important;
  color: var(--dt-primary-foreground) !important;
  width: 2rem; height: 2rem;
  box-shadow: none !important;
}
${S} form[data-slot="composer-root"] button[type="submit"]:disabled { opacity: 0.35; }
${S} form[data-slot="composer-root"] button[data-variant="ghost"][data-size="default"] {
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text-secondary);
}
${S} form[data-slot="composer-root"] button[data-variant="ghost"][data-size="icon"] { border-radius: 0.5rem; }

/* ── empty state: serif greeting + centered composer ─────────────────────── */
${S} [data-slot="aui_intro"] .wordmark { display: none; }
${S} [data-slot="aui_intro"] { padding-bottom: 1rem !important; }
${S} [data-slot="aui_intro"] > div {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: baseline;
  column-gap: 0.75rem;
}
/* Terracotta asterisk + serif greeting on one line, personality copy under it. */
${S} [data-slot="aui_intro"] > div::before {
  content: "\\2731";
  order: 1;
  font-size: 1.75rem;
  line-height: 1;
  color: var(--dt-primary);
}
${S} [data-slot="aui_intro"] > div::after {
  content: var(--claude-greeting, "${GREETING_NAME ? `Hello, ${GREETING_NAME}` : 'Hello'}");
  order: 2;
  font-family: var(--claude-font-serif);
  font-size: 2.25rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--ui-text-primary);
}
${S} [data-slot="aui_intro"] p {
  order: 3; flex-basis: 100%;
  margin-top: 0.75rem;
  font-size: 0.9375rem;
  color: var(--ui-text-tertiary);
}
/* Claude's placeholders. */
${S} [data-slot="composer-rich-input"]:is(:empty, [data-empty])::before { content: "Reply to Hermes…"; }
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="composer-rich-input"]:is(:empty, [data-empty])::before { content: "How can I help you today?"; }
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="composer-dock"] {
  bottom: auto;
  top: 50%;
  margin-top: 0;
}
/* The greeting sits in the top half, ending just above the centered composer. */
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="aui_thread-content"] { height: 100%; }
${S} [data-chat-surface]:has([data-slot="aui_intro"]) [data-slot="aui_thread-content"] > div > div {
  padding-top: 0 !important;
  align-self: start;
  height: 50%;
  min-height: 0;
  justify-content: flex-end;
  padding-bottom: 1.5rem;
}
${S} [data-chat-surface]:has([data-slot="aui_intro"]) button[aria-label="Scroll to bottom"] { display: none; }
`

// ── Greeting clock ──────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours()
  const word = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return GREETING_NAME ? `${word}, ${GREETING_NAME}` : word
}

function paintGreeting() {
  document.documentElement.style.setProperty('--claude-greeting', JSON.stringify(greeting()))
}

// ── First-run: pick the theme, follow the system, clear the right rail ─────
// The desktop stores theme + mode per profile, so each profile gets its own
// one-time setup (`setup:<profile>`). The legacy global `setup` flag counts
// as done for the default profile, where it was first recorded.

function setupKey(profile) {
  return `setup:${profile}`
}

function isSetUp(storage, profile) {
  if (storage.get(setupKey(profile), false)) return true
  return profile === 'default' && storage.get('setup', false)
}

function FirstRun({ storage }) {
  const { setMode } = useTheme()
  const profile = profileKey(useValue(host.state.profile))

  useEffect(() => {
    if (isSetUp(storage, profile)) return
    // Unconditional: right after a profile swap `themeName` can still be the
    // previous profile's for a render. Both writes land on the live profile.
    requestTheme(THEME_NAME)
    setMode('system')
    // Claude has no file rail. Close it once; the titlebar toggle brings it back.
    const rail = document.querySelector('button[aria-label="Hide right sidebar"]')
    if (rail) rail.click()
    storage.set(setupKey(profile), true)
  }, [profile, setMode, storage])

  return null
}

// ── Plugin ──────────────────────────────────────────────────────────────────

export default {
  id: PLUGIN_ID,
  name: 'Claude skin',
  description: 'Claude desktop look: cream/charcoal palette, centered column, rounded composer.',
  defaultEnabled: true,
  register(ctx) {
    const style = document.createElement('style')
    style.id = STYLE_ID
    style.textContent = CSS
    document.head.appendChild(style)
    ctx.onDispose(() => style.remove())

    paintGreeting()
    ctx.setInterval(paintGreeting, 5 * 60 * 1000)

    // Titlebar magnifier beside the sidebar toggle (Claude's top-left pair).
    const focusSearch = () => {
      const find = () => document.querySelector('input[aria-label="Search sessions"]')
      let input = find()
      if (!input) {
        const show = document.querySelector('button[aria-label="Show sidebar"]')
        if (show) show.click()
        setTimeout(() => { const i = find(); if (i) { i.focus(); i.select() } }, 120)
        return
      }
      input.focus()
      input.select()
    }
    const ensureSearchButton = () => {
      const cluster = document.querySelector('[data-titlebar-cluster="left"]')
      if (!cluster || cluster.querySelector('#claude-skin-search')) return
      const btn = document.createElement('button')
      btn.id = 'claude-skin-search'
      btn.type = 'button'
      btn.setAttribute('aria-label', 'Search sessions')
      btn.innerHTML = '<i class="codicon codicon-search" aria-hidden="true" style="font-size:13.9px"></i>'
      btn.addEventListener('click', focusSearch)
      cluster.appendChild(btn)
    }
    // "More" row at the end of the nav list; CSS orders it after New /
    // Artifacts / Customize and folds everything else behind it.
    const MORE_ATTR = 'data-claude-nav-more'
    const setMoreOpen = open => {
      document.documentElement.toggleAttribute(MORE_ATTR, open)
      ctx.storage.set('navMore', open)
    }
    const ensureMoreRow = () => {
      const menu = document.querySelector('ul[data-sidebar="menu"]:has([data-tour="sidebar-nav-new-session"])')
      if (!menu || menu.querySelector('[data-claude-more]')) return
      const row = document.createElement('li')
      row.id = 'claude-skin-more'
      row.setAttribute('data-claude-more', '')
      row.setAttribute('data-sidebar', 'menu-item')
      row.innerHTML =
        '<button type="button" data-sidebar="menu-button" aria-label="More"><i class="codicon codicon-chevron-down" aria-hidden="true"></i><span></span></button>'
      row.querySelector('button').addEventListener('click', () => setMoreOpen(!document.documentElement.hasAttribute(MORE_ATTR)))
      menu.appendChild(row)
    }
    document.documentElement.toggleAttribute(MORE_ATTR, Boolean(ctx.storage.get('navMore', false)))

    ensureSearchButton()
    ensureMoreRow()
    ctx.setInterval(() => {
      ensureSearchButton()
      ensureMoreRow()
    }, 1000)
    ctx.onDispose(() => document.getElementById('claude-skin-search')?.remove())
    ctx.onDispose(() => {
      document.getElementById('claude-skin-more')?.remove()
      document.documentElement.removeAttribute(MORE_ATTR)
    })
    ctx.onDispose(() => document.documentElement.style.removeProperty('--claude-greeting'))

    ctx.registerMany([
      { id: 'theme', area: THEMES_AREA, data: theme },
      ...EXTRA_THEMES.map(t => ({ id: `theme-${t.name}`, area: THEMES_AREA, data: t })),
      ...[theme, ...EXTRA_THEMES].map(t => ({
        id: `use-${t.name}`,
        area: PALETTE_AREA,
        data: {
          id: `claude-skin.use.${t.name}`,
          label: `Theme: ${t.label}`,
          keywords: ['theme', 'palette', 'skin', 'claude', t.label.toLowerCase()],
          run: () => requestTheme(t.name)
        }
      })),
      { id: 'first-run', area: TITLEBAR_AREAS.right, order: 999, render: () => jsx(FirstRun, { storage: ctx.storage }) },
      {
        id: 'apply',
        area: PALETTE_AREA,
        data: {
          id: 'claude-skin.apply',
          label: 'Claude skin: Apply theme',
          keywords: ['claude', 'theme', 'skin', 'appearance'],
          run: () => requestTheme(THEME_NAME)
        }
      }
    ])
  }
}
