import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateMarketplace } from '../scripts/validate.mjs'

function base() {
  return {
    name: 'codex-marketplace',
    interface: { displayName: 'Test' },
    plugins: [
      {
        name: 'nebula-mcp',
        source: {
          source: 'git-subdir',
          url: 'https://github.com/MuYiYong/nebula-mcp',
          path: 'plugins/nebula-mcp',
          ref: 'main',
          sha: 'b6022b4a4270e16ea11a3ce37db3a7be0129f190',
        },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: 'Developer Tools',
      },
    ],
  }
}

test('accepts the current manifest shape', () => {
  assert.deepEqual(validateMarketplace(base()), [])
})

test('rejects duplicate plugin names', () => {
  const document = base()
  document.plugins.push(structuredClone(document.plugins[0]))
  assert.match(validateMarketplace(document).join('\n'), /duplicates/)
})

test('rejects a non-pinned or malformed sha', () => {
  for (const sha of ['main', 'abc123']) {
    const document = base()
    document.plugins[0].source.sha = sha
    assert.match(validateMarketplace(document).join('\n'), /40-character commit SHA/)
  }
})

test('rejects a local path that escapes the marketplace', () => {
  const document = base()
  document.plugins[0].source = { source: 'local', path: '../plugin' }
  assert.match(validateMarketplace(document).join('\n'), /start with/)
})

test('rejects unknown source kinds and empty plugin lists', () => {
  const document = base()
  document.plugins[0].source = { source: 'file', path: 'x' }
  assert.match(validateMarketplace(document).join('\n'), /one of local, url, git-subdir, npm/)
  document.plugins = []
  assert.match(validateMarketplace(document).join('\n'), /non-empty array/)
})
