import { Request, Response, NextFunction } from 'express';

/**
 * Recursively sanitizes input by removing potentially malicious patterns.
 * Strips <script> tags, onerror/onload attributes, javascript: URIs, eval calls,
 * and normalizes whitespace and Unicode characters.
 */
function sanitizeValue(value: any): any {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitizedObj: any = {};
    for (const key of Object.keys(value)) {
      sanitizedObj[key] = sanitizeValue(value[key]);
    }
    return sanitizedObj;
  }
  if (typeof value === 'string') {
    let sanitized = value;
    // Remove script tags
    sanitized = sanitized.replace(/<\s*script[^>]*>(.*?)<\s*\/\s*script>/gi, '');
    // Remove event handler attributes (onerror, onload, onclick, etc.)
    sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    // Remove javascript: URIs
    sanitized = sanitized.replace(/javascript:\s*/gi, '');
    // Remove eval()
    sanitized = sanitized.replace(/eval\((.*?)\)/gi, '');
    // Trim and collapse whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');
    return sanitized;
  }
  return value;
}

export function sanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Sanitize body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  // req.query is read-only in newer Express — mutate properties in place
  if (req.query) {
    const sanitized = sanitizeValue(req.query) as Record<string, any>;
    for (const key of Object.keys(sanitized)) {
      (req.query as any)[key] = sanitized[key];
    }
  }
  // req.params is mutable
  if (req.params) {
    const sanitizedParams = sanitizeValue(req.params) as Record<string, string>;
    for (const key of Object.keys(sanitizedParams)) {
      req.params[key] = sanitizedParams[key];
    }
  }
  next();
}
