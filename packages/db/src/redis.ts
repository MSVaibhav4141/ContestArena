import {Redis} from "ioredis";

type RedisClients = {
  redis: Redis;
  pub: Redis;
  sub: Redis;
};

declare global {
  var redisClients: RedisClients | undefined;
}

const createClients = (): RedisClients => ({
  redis: new Redis(process.env.REDIS_URL!),
  pub: new Redis(process.env.REDIS_URL!),
  sub: new Redis(process.env.REDIS_URL!)
});

const clients: RedisClients =
  global.redisClients ?? createClients();

if (process.env.NODE_ENV !== "production") {
  global.redisClients = clients;
}

export const redis = clients.redis;
export const pub = clients.pub;
export const sub = clients.sub;