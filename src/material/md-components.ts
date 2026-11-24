/**
 * Official Material Web (@material/web) components wrapped for React via @lit/react.
 * These are Google's Material 3 web components — not a third-party Material clone.
 */
import { createComponent } from '@lit/react'
import { MdFilledButton } from '@material/web/button/filled-button.js'
import { MdOutlinedButton } from '@material/web/button/outlined-button.js'
import { MdTextButton } from '@material/web/button/text-button.js'
import { MdAssistChip } from '@material/web/chips/assist-chip.js'
import { MdSuggestionChip } from '@material/web/chips/suggestion-chip.js'
import { MdDivider } from '@material/web/divider/divider.js'
import { MdIcon } from '@material/web/icon/icon.js'
import { MdElevatedCard } from '@material/web/labs/card/elevated-card.js'
import { MdOutlinedCard } from '@material/web/labs/card/outlined-card.js'
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js'
import React from 'react'

export const FilledButton = createComponent({
  tagName: 'md-filled-button',
  elementClass: MdFilledButton,
  react: React,
})

export const OutlinedButton = createComponent({
  tagName: 'md-outlined-button',
  elementClass: MdOutlinedButton,
  react: React,
})

export const TextButton = createComponent({
  tagName: 'md-text-button',
  elementClass: MdTextButton,
  react: React,
  events: {
    onClick: 'click',
  },
})

export const OutlinedTextField = createComponent({
  tagName: 'md-outlined-text-field',
  elementClass: MdOutlinedTextField,
  react: React,
  events: {
    onChange: 'change',
    onInput: 'input',
  },
})

export const ElevatedCard = createComponent({
  tagName: 'md-elevated-card',
  elementClass: MdElevatedCard,
  react: React,
})

export const OutlinedCard = createComponent({
  tagName: 'md-outlined-card',
  elementClass: MdOutlinedCard,
  react: React,
})

export const AssistChip = createComponent({
  tagName: 'md-assist-chip',
  elementClass: MdAssistChip,
  react: React,
})

export const SuggestionChip = createComponent({
  tagName: 'md-suggestion-chip',
  elementClass: MdSuggestionChip,
  react: React,
})

export const Icon = createComponent({
  tagName: 'md-icon',
  elementClass: MdIcon,
  react: React,
})

export const Divider = createComponent({
  tagName: 'md-divider',
  elementClass: MdDivider,
  react: React,
})
