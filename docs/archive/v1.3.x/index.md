---
layout: home
title: 'xAnsi'
titleTemplate: 'A lightweight ANSI utility library for styling terminal output'
hero:
  name: 'xAnsi'
  text: 'Style, move, and redraw the terminal'
  tagline: xAnsi is a dependency-free ANSI toolkit - a type-checked styling chain, the escape sequences around it, and a renderer that redraws only what changed.
  actions:
    - theme: brand
      text: Get Started
      link: ./guide
    - theme: alt
      text: Components
      link: ./guide/xterm
    - theme: alt
      text: GitHub
      link: https://github.com/remotex-labs/xAnsi
  image:
    src: /logo.png
    alt: 'xAnsi logo'
features:
  - title: Chainable styling
    icon: 🎨
    details: '`xterm.bold.red`, `rgb()`, and `hex()` compose into one chain, and each call returns a fresh one.'
  - title: Type-checked combinations
    icon: 🧠
    details: The chain type tracks what it carries, so a second foreground or background color is a compile-time error.
  - title: Terminal control
    icon: 🕹️
    details: '`ANSI` constants and `moveCursor` for clearing, hiding, saving, and positioning, plus `stripAnsi` to undo it all.'
  - title: Shadow renderer
    icon: 🪟
    details: A virtual viewport that diffs a content buffer against the screen and writes only the cells that differ.
  - title: Scrolling and resizing
    icon: 📜
    details: Hold content taller or wider than the terminal, scroll it by row, and move or resize the viewport at runtime.
  - title: Small and tree-shakeable
    icon: 📦
    details: No dependencies, ESM and CommonJS, and a subpath per component so a bundler keeps only what you import.
---
