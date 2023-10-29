import {LRUCache} from 'lru-cache';

const emailVerificationTokenCache = new LRUCache<string, string>({
    max: 1000,
    ttl: 1000 * 60 * 15,
});

const passwordResetTokenCache = new LRUCache<string,string>({
    max: 1000,
    ttl: 1000 * 60 * 10,
});

export default {
    emailVerificationTokenCache,
    passwordResetTokenCache,
}