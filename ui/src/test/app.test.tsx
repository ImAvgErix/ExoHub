import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ExoApp } from '../components/ExoApp'
import { rankFeatureLines, stateFromStatus, staleCopy } from '../lib/moduleState'

// Host bridge falls back to mock data outside WebView2.

describe('ExoApp AMOLED shell', () => {
  it('renders home meters and module nav', async () => {
    render(<ExoApp />)

    await waitFor(() => {
      expect(screen.getByLabelText('This PC')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Home')).toBeInTheDocument()
    expect(screen.getByLabelText('Modules')).toBeInTheDocument()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
    expect(screen.getByLabelText('NVIDIA')).toBeInTheDocument()
    expect(screen.getByLabelText('Windows')).toBeInTheDocument()
    expect(screen.getByText('On this PC')).toBeInTheDocument()
  })

  it('opens a module page when an optimizer icon is clicked', async () => {
    const user = userEvent.setup()
    render(<ExoApp />)

    await waitFor(() => {
      expect(screen.getByLabelText('NVIDIA')).toBeInTheDocument()
    })
    await user.click(screen.getByLabelText('NVIDIA'))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'NVIDIA' })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Apply|Reapply|Retry/i })).toBeInTheDocument()
  })

  it('keeps a single Update action in Settings (no step text)', async () => {
    const user = userEvent.setup()
    render(<ExoApp />)

    await user.click(screen.getByLabelText('Settings'))
    expect(screen.getByLabelText('Update Exo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View logs/i })).toBeInTheDocument()
    expect(screen.queryByText(/Check for updates/i)).not.toBeInTheDocument()
    expect(screen.queryByText('CHECK FOR UPDATES')).not.toBeInTheDocument()
    expect(screen.queryByText('TEXT COLOUR')).not.toBeInTheDocument()
  })

  it('exposes close next to settings (no minimize)', async () => {
    render(<ExoApp />)
    await waitFor(() => {
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Minimize')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Settings')).toBeInTheDocument()
  })
})

describe('module state helpers', () => {
  it('ranks off rows ahead of info lines', () => {
    const lines = rankFeatureLines(
      [
        { title: 'CPU (info)', detail: '5600X', active: true },
        { title: 'Game Mode', detail: 'off', active: false },
        { title: 'HAGS', detail: 'on', active: true },
      ],
      [],
    )
    expect(lines[0].text).toMatch(/Game Mode/)
    expect(lines[0].active).toBe(false)
    expect(lines.some((l) => l.info && /CPU/.test(l.text))).toBe(true)
  })

  it('maps host status kinds without inventing applied', () => {
    expect(stateFromStatus({ id: 'steam', isApplied: false, statusKind: 'partial', statusText: '', detail: '', features: [] })).toBe('partial')
    expect(stateFromStatus({ id: 'steam', isApplied: true, statusKind: 'applied', statusText: '', detail: '', features: [] })).toBe('applied')
  })

  it('explains superseded vs unstamped without blaming the machine', () => {
    expect(staleCopy('superseded')).toMatch(/tuning changed/)
    expect(staleCopy('unstamped')).toMatch(/no record/)
    expect(staleCopy(undefined)).toBeNull()
  })
})
