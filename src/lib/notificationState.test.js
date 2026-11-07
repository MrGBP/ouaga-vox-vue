import { describe, it, expect } from 'bun:test';
import { countUnread, upsertNotification, markOneRead, markEveryRead, removeNotification, unreadTotal } from './notificationState.ts';

const n = (id, read, t) => ({ id, read, created_at: `2026-11-07T10:0${t}:00Z` });

describe('notification unread counter', () => {
  it('reading one notification lowers the counter by one', () => {
    const items = [n('a', false, 2), n('b', false, 1)];
    expect(countUnread(markOneRead(items, 'a'))).toBe(1);
  });
  it('a new incoming notification raises the counter by one', () => {
    const items = [n('a', false, 1)];
    expect(countUnread(upsertNotification(items, n('b', false, 2)))).toBe(2);
  });
  it('the same notification received twice is counted once', () => {
    const items = upsertNotification([n('a', false, 1)], n('a', false, 1));
    expect(items.length).toBe(1);
    expect(countUnread(items)).toBe(1);
  });
  it('a notification read on another device updates the counter', () => {
    const items = upsertNotification([n('a', false, 1), n('b', false, 2)], n('a', true, 1));
    expect(countUnread(items)).toBe(1);
  });
  it('mark all as read brings the counter to zero', () => {
    expect(countUnread(markEveryRead([n('a', false, 1), n('b', false, 2)]))).toBe(0);
  });
  it('a deleted unread notification lowers the counter', () => {
    expect(countUnread(removeNotification([n('a', false, 1), n('b', false, 2)], 'a'))).toBe(1);
  });
  it('unread rows beyond the loaded list stay counted', () => {
    // server: 5 unread in total, 2 of them loaded; locally one of those 2 was read
    expect(unreadTotal(5, 2, [n('a', true, 1), n('b', false, 2)])).toBe(4);
  });
});
