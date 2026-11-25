#!/usr/bin/env node
/**
 * Validate the Codex marketplace manifest without network access.
 *
 * The real schema lives in Codex (`RawMarketplaceManifest`). This checks the
 * subset this repository uses so a broken pin or relative path fails in CI
 * instead of at `codex plugin marketplace add` time.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const MANIFEST_URL = new URL('../.agents/plugins/marketplace.json', import.meta.url)
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/
const SHA = /^[0-9a-f]{40}$/i
const INSTALL = new Set(['AVAILABLE', 'INSTALLED_BY_DEFAULT', 'NOT_AVAILABLE'])
const AUTH = new Set(['ON_INSTALL', 'ON_USE'])

function lines(prefix, message) {
  return `${prefix}: ${message}`
}

function requireString(value, label, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${label} must be a non-empty string`)
    return false
  }
  return true
}

function validateSource(source, label, errors) {
  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    errors.push(`${label} must be an object`)
    return
  }
  const kind = source.source
  if (typeof kind !== 'string') {
    errors.push(`${label}.source must be a string`)
    return
  }
  if (kind === 'local') {
    if (!requireString(source.path, `${label}.path`, errors)) return
    if (!source.path.startsWith('./')) {
      errors.push(`${label}.path must start with "./"`)
    }
    if (source.path.split('/').includes('..')) {
      errors.push(`${label}.path must not escape the marketplace repository`)
    }
    return
  }
  if (kind === 'git-subdir' || kind === 'url') {
    if (!requireString(source.url, `${label}.url`, errors)) return
    if (!/^https:\/\/[^\s]+$/i.test(source.url)) {
      errors.push(`${label}.url must be an https URL`)
    }
    if (kind === 'git-subdir' && !requireString(source.path, `${label}.path`, errors)) {
      return
    }
    if (source.path !== undefined) {
      if (!requireString(source.path, `${label}.path`, errors)) return
      if (source.path.startsWith('/') || source.path.split('/').includes('..')) {
        errors.push(`${label}.path must be a repository-relative subdirectory`)
      }
    }
    if (source.sha !== undefined) {
      if (!requireString(source.sha, `${label}.sha`, errors)) return
      if (!SHA.test(source.sha)) errors.push(`${label}.sha must be a 40-character commit SHA`)
    }
    if (source.ref !== undefined && !requireString(source.ref, `${label}.ref`, errors)) return
    return
  }
  if (kind === 'npm') {
    requireString(source.package, `${label}.package`, errors)
    return
  }
  errors.push(`${label}.source must be one of local, url, git-subdir, npm`)
}

export function validateMarketplace(document) {
  const errors = []
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    return ['manifest must be a JSON object']
  }
  if (!requireString(document.name, 'name', errors)) {
    // Continue to report plugin errors too.
  } else if (!SEGMENT.test(document.name)) {
    errors.push('name must be a valid marketplace segment')
  }
  if (document.interface !== undefined) {
    if (typeof document.interface !== 'object' || document.interface === null) {
      errors.push('interface must be an object')
    } else if (document.interface.displayName !== undefined) {
      requireString(document.interface.displayName, 'interface.displayName', errors)
    }
  }
  if (!Array.isArray(document.plugins) || document.plugins.length === 0) {
    errors.push('plugins must be a non-empty array')
    return errors
  }
  const seen = new Set()
  document.plugins.forEach((plugin, index) => {
    const label = `plugins[${index}]`
    if (typeof plugin !== 'object' || plugin === null || Array.isArray(plugin)) {
      errors.push(`${label} must be an object`)
      return
    }
    if (requireString(plugin.name, `${label}.name`, errors)) {
      if (!SEGMENT.test(plugin.name)) errors.push(`${label}.name is not a valid plugin segment`)
      if (seen.has(plugin.name)) errors.push(`${label}.name duplicates "${plugin.name}"`)
      seen.add(plugin.name)
    }
    validateSource(plugin.source, `${label}.source`, errors)
    if (plugin.policy !== undefined) {
      if (typeof plugin.policy !== 'object' || plugin.policy === null) {
        errors.push(`${label}.policy must be an object`)
      } else {
        if (!INSTALL.has(plugin.policy.installation)) {
          errors.push(`${label}.policy.installation must be AVAILABLE or similar`)
        }
        if (!AUTH.has(plugin.policy.authentication)) {
          errors.push(`${label}.policy.authentication must be ON_INSTALL or ON_USE`)
        }
      }
    }
    if (plugin.category !== undefined) requireString(plugin.category, `${label}.category`, errors)
  })
  return errors
}

async function main() {
  let document
  try {
    document = JSON.parse(await readFile(MANIFEST_URL, 'utf8'))
  } catch (error) {
    console.error(lines('codex-marketplace', `cannot read manifest: ${error.message}`))
    return 1
  }
  const errors = validateMarketplace(document)
  if (errors.length > 0) {
    for (const error of errors) console.error(lines('codex-marketplace', error))
    return 1
  }
  console.log(`codex-marketplace: ${document.plugins.length} plugin(s) valid`)
  return 0
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main()
}
