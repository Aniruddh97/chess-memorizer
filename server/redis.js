const { createClient } = require("redis");

let REDIS_CLIENT = null;

const initRedis = async () => {
    if (!process.env.REDIS_URL) {
        console.error("env variable `REDIS_URL` not set");
        return;
    }

    if (!REDIS_CLIENT) {
        REDIS_CLIENT = createClient({
            url: process.env.REDIS_URL,
        });
        await REDIS_CLIENT.connect();
    }
};

const redisSet = async (key, data) => {
    if (REDIS_CLIENT) {
        return await REDIS_CLIENT.set(key, data);
    }
    return false;
};

const redisGet = async (key) => {
    if (REDIS_CLIENT) {
        return await REDIS_CLIENT.get(key);
    }
    return false;
};

module.exports = {
    initRedis,
    redisGet,
    redisSet,
};
