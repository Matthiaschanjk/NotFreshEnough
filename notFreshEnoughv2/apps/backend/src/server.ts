import { env } from "./config/env";
import { createApp } from "./app";

const app = createApp(env);

app.listen(env.BACKEND_PORT, () => {
  console.log(`NotFreshEnough backend listening on http://localhost:${env.BACKEND_PORT}`);
});
