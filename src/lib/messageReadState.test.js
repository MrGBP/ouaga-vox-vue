import { describe, it, expect } from 'bun:test';
import { unreadIncoming } from './messageReadState.ts';
describe('recipient read state', () => {
  it('counts unread client messages for the owner independently of client receipts', () => {
    expect(unreadIncoming([{id:'1',sender_id:'client',read_by_client:true,read_by_owner:false},{id:'2',sender_id:'owner',read_by_owner:false}], 'owner','owner')).toEqual(['1']);
  });
  it('reading one conversation leaves the other conversation unread', () => {
    const conversations = [{id:'1',sender_id:'client',read_by_owner:true},{id:'2',sender_id:'client',read_by_owner:false}];
    expect(unreadIncoming(conversations,'owner','owner')).toEqual(['2']);
  });
});