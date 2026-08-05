(function exposeStorage(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EAStorage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createStorageModule() {
  'use strict';

  function clone(value) {
    if (value === undefined) return undefined;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed === null ? clone(fallback) : parsed;
    } catch {
      return clone(fallback);
    }
  }

  function createStorage({ backend, key, validate = value => Boolean(value && typeof value === 'object') } = {}) {
    if (!backend || typeof backend.getItem !== 'function' || typeof backend.setItem !== 'function') {
      throw new TypeError('A Web Storage compatible backend is required');
    }
    if (!key) throw new TypeError('A storage key is required');

    return Object.freeze({
      key,
      load(fallback) {
        const raw = backend.getItem(key);
        if (raw === null) return clone(fallback);
        const parsed = safeParse(raw, fallback);
        return validate(parsed) ? parsed : clone(fallback);
      },
      save(value) {
        if (!validate(value)) throw new TypeError('Refusing to persist an invalid application state');
        backend.setItem(key, JSON.stringify(value));
        return value;
      },
      remove() {
        backend.removeItem(key);
      },
      exportBackup(value) {
        if (!validate(value)) throw new TypeError('Cannot export an invalid application state');
        return JSON.stringify(value, null, 2);
      },
      importBackup(json) {
        const parsed = safeParse(json, null);
        if (!validate(parsed)) throw new TypeError('The backup does not contain a valid application state');
        return clone(parsed);
      }
    });
  }

  return Object.freeze({ clone, safeParse, createStorage });
});
