const axios = require('axios');
const api = axios.create();
api.defaults.adapter = async (config) => {
  console.log("config.data type:", typeof config.data);
  console.log("config.data:", config.data);
  return { status: 200, data: "ok" };
};
api.post('/test', [{ name: "test" }]).catch(console.error);
