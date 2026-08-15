import { describe, expect, it } from 'vitest'
import { MODULES } from '../lib/modules'

describe('module catalog', () => {
  it('lists the eight optimizers in shell order', () => {
    expect(MODULES.map((m) => m.id)).toEqual([
      'nvidia',
      'amd',
      'system',
      'internet',
      'steam',
      'discord',
      'spotify',
      'brave',
    ])
  })

  it('does not claim Spotify turns hardware acceleration on', () => {
    const spotify = MODULES.find((m) => m.id === 'spotify')
    expect(spotify?.does.join(' ')).toMatch(/hardware acceleration off/i)
    expect(spotify?.does.join(' ')).not.toMatch(/applies hardware acceleration/i)
  })

  it('asks before applying NVIDIA and Internet profiles', () => {
    const nvidia = MODULES.find((m) => m.id === 'nvidia')
    const internet = MODULES.find((m) => m.id === 'internet')
    expect(nvidia?.applyOptions?.(0)).toEqual({ useGsync: true })
    expect(nvidia?.applyOptions?.(1)).toEqual({ useGsync: false })
    expect(internet?.applyOptions?.(0)).toEqual({ preferLowestLatency: true })
    expect(internet?.applyOptions?.(1)).toEqual({ preferLowestLatency: false })
  })
})
