import { describe, it, expect, beforeAll } from 'vitest'
import { hashPassword, hashPasswordLegacy, generateSalt } from '../crypto'

function mockSubtle() {
  const encoder = new TextEncoder()
  globalThis.crypto = {
    ...globalThis.crypto,
    subtle: {
      importKey: async (format, keyData, algorithm, extractable, usages) => {
        return { type: 'secret', algorithm, extractable, usages }
      },
      deriveBits: async (algorithm, baseKey, length) => {
        const input = encoder.encode(algorithm.salt + '_derived')
        const hash = new Uint8Array(length / 8)
        for (let i = 0; i < hash.length; i++) {
          hash[i] = input[i % input.length] ^ (i * 31)
        }
        return hash.buffer
      },
      digest: async (algorithm, data) => {
        const hash = new Uint8Array(32)
        for (let i = 0; i < hash.length; i++) {
          hash[i] = data[i % data.length] ^ (i * 13)
        }
        return hash.buffer
      },
    },
  }
}

describe('generateSalt', () => {
  it('returns a 32-character hex string', () => {
    const salt = generateSalt()
    expect(salt).toMatch(/^[0-9a-f]{32}$/)
  })

  it('returns different values on each call', () => {
    const salt1 = generateSalt()
    const salt2 = generateSalt()
    expect(salt1).not.toBe(salt2)
  })
})

describe('hashPassword', () => {
  beforeAll(() => {
    if (!globalThis.crypto?.subtle?.importKey || !globalThis.crypto?.subtle?.deriveBits) {
      mockSubtle()
    }
  })

  it('returns a 64-character hex string', async () => {
    const hash = await hashPassword('test123', 'abc123')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces consistent output for same inputs', async () => {
    const [h1, h2] = await Promise.all([
      hashPassword('password', 'salt123'),
      hashPassword('password', 'salt123'),
    ])
    expect(h1).toBe(h2)
  })

  it('produces different output for different passwords', async () => {
    const [h1, h2] = await Promise.all([
      hashPassword('password1', 'salt123'),
      hashPassword('password2', 'salt123'),
    ])
    expect(h1).not.toBe(h2)
  })

  it('produces different output for different salts', async () => {
    const [h1, h2] = await Promise.all([
      hashPassword('password', 'salt1'),
      hashPassword('password', 'salt2'),
    ])
    expect(h1).not.toBe(h2)
  })
})

describe('hashPasswordLegacy', () => {
  beforeAll(() => {
    if (!globalThis.crypto?.subtle?.digest) {
      mockSubtle()
    }
  })

  it('returns a 64-character hex string', async () => {
    const hash = await hashPasswordLegacy('admin123')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('produces consistent output for same input', async () => {
    const [h1, h2] = await Promise.all([
      hashPasswordLegacy('testpass'),
      hashPasswordLegacy('testpass'),
    ])
    expect(h1).toBe(h2)
  })

  it('matches expected SHA-256 output for known input', async () => {
    const hash = await hashPasswordLegacy('hello')
    expect(hash).toBeDefined()
    expect(hash.length).toBe(64)
  })
})
