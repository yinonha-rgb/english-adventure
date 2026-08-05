(function exposeState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EAState = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createStateModule() {
  'use strict';

  const clone = value => {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };

  function createAppState({ storage, defaults, normalize = value => value } = {}) {
    if (!storage?.load || !storage?.save) throw new TypeError('A storage service is required');
    const initial = typeof defaults === 'function' ? defaults() : defaults;
    let current = normalize(storage.load(initial));
    const listeners = new Set();
    const notify = () => listeners.forEach(listener => listener(clone(current)));

    return Object.freeze({
      peek: () => current,
      snapshot: () => clone(current),
      persist(value = current) {
        if (value !== current) current = normalize(value);
        storage.save(current);
        notify();
        return current;
      },
      replace(value, { persist = true } = {}) {
        current = normalize(clone(value));
        if (persist) storage.save(current);
        notify();
        return current;
      },
      update(mutator, { persist = true } = {}) {
        if (typeof mutator !== 'function') throw new TypeError('State update must be a function');
        const draft = clone(current);
        const result = mutator(draft);
        current = normalize(result === undefined ? draft : result);
        if (persist) storage.save(current);
        notify();
        return current;
      },
      activeProfile() {
        return current.profiles?.find(profile => profile.id === current.selected) || current.profiles?.[0] || null;
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }
    });
  }

  function awardXP(progress, { key, amount, label, day, now = new Date(), id } = {}) {
    if (!progress || !key || !Number.isFinite(amount) || !day) return false;
    progress.awards ||= {};
    const stamp = `${day}:${key}`;
    if (Object.prototype.hasOwnProperty.call(progress.awards, stamp)) return false;
    progress.awards[stamp] = amount;
    progress.xp = Number(progress.xp || 0) + amount;
    progress.study ||= {};
    progress.study[day] = Number(progress.study[day] || 0) + 1;
    if (progress.lastDay !== day) {
      const previous = new Date(`${day}T12:00:00Z`);
      previous.setUTCDate(previous.getUTCDate() - 1);
      const previousDay = previous.toISOString().slice(0, 10);
      progress.streak = progress.lastDay === previousDay ? Number(progress.streak || 0) + 1 : 1;
      progress.lastDay = day;
    }
    progress.activity ||= [];
    const activityId = id || `award:${stamp}`;
    if (!progress.activity.some(entry => entry.id === activityId)) {
      progress.activity.unshift({ id: activityId, at: now.toISOString(), label, xp: amount });
      progress.activity = progress.activity.slice(0, 80);
    }
    return true;
  }

  function addMistake(progress, mistake, { now = Date.now(), retryAfterMs = 86400000 } = {}) {
    if (!progress || !mistake || (!mistake.qid && !mistake.exerciseId && !mistake.word)) return null;
    progress.mistakes ||= [];
    const same = item =>
      (item.lesson || item.lessonId || '') === (mistake.lesson || mistake.lessonId || '') &&
      (item.qid || item.exerciseId || item.word || '') === (mistake.qid || mistake.exerciseId || mistake.word || '');
    const existing = progress.mistakes.find(same);
    if (existing) {
      existing.count = Number(existing.count || 1) + 1;
      existing.lastAt = new Date(now).toISOString();
      existing.next = now + retryAfterMs;
      return existing;
    }
    const record = { ...clone(mistake), count: Number(mistake.count || 1), lastAt: new Date(now).toISOString(), next: now + retryAfterMs };
    progress.mistakes.push(record);
    return record;
  }

  return Object.freeze({ createAppState, awardXP, addMistake });
});
