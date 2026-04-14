const CIDR_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}\/(?:[0-9]|[1-2][0-9]|3[0-2])$/
const IPV4_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/
const TEMPLATE_PLACEHOLDER_REGEX = /\{\{\s*([a-z_]+)\s*\}\}/g

export function validateRetentionDays(days: number): string | null {
  if (!Number.isFinite(days) || days < 1) {
    return 'Retention period must be at least 1 day.'
  }

  if (days > 3650) {
    return 'Retention period cannot exceed 3650 days.'
  }

  return null
}

export function validateUploadLimitMb(limit: number): string | null {
  if (!Number.isFinite(limit) || limit < 1) {
    return 'Upload limit must be at least 1 MB.'
  }

  if (limit > 100) {
    return 'Upload limit cannot exceed 100 MB.'
  }

  return null
}

export function validateSoftDeleteDays(days: number): string | null {
  if (!Number.isFinite(days) || days < 1) {
    return 'Soft delete duration must be at least 1 day.'
  }

  if (days > 365) {
    return 'Soft delete duration cannot exceed 365 days.'
  }

  return null
}

export function validatePasswordMinLength(length: number): string | null {
  if (!Number.isFinite(length) || length < 8) {
    return 'Minimum password length must be at least 8.'
  }

  if (length > 64) {
    return 'Minimum password length cannot exceed 64.'
  }

  return null
}

export function validateRateLimit(limit: number): string | null {
  if (!Number.isFinite(limit) || limit < 1) {
    return 'Rate limit must be at least 1 request per minute.'
  }

  if (limit > 5000) {
    return 'Rate limit cannot exceed 5000 requests per minute.'
  }

  return null
}

export function validateIpRange(entry: string): string | null {
  const normalized = entry.trim()
  if (!normalized) {
    return 'IP range cannot be empty.'
  }

  if (!CIDR_REGEX.test(normalized) && !IPV4_REGEX.test(normalized)) {
    return 'Use IPv4 or CIDR format (example: 192.168.0.0/24).'
  }

  const ipPart = normalized.includes('/') ? normalized.split('/')[0] : normalized
  const octets = ipPart.split('.').map((item) => Number(item))
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return 'IP address octets must be between 0 and 255.'
  }

  return null
}

export function validateTemplatePlaceholders(template: string, allowedKeys: string[]): string | null {
  const found = template.matchAll(TEMPLATE_PLACEHOLDER_REGEX)
  for (const match of found) {
    const key = match[1]
    if (!allowedKeys.includes(key)) {
      return `Unsupported placeholder: {{${key}}}`
    }
  }

  return null
}
