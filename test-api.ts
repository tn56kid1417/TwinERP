import { api } from './src/twin-crm/services/api';
api.post('/leads/batch', [{ name: "test", email: "test@test.com" }])
  .then(console.log)
  .catch(console.error);
