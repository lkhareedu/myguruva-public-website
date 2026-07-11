import { createApp } from "./app.js";
import { env } from "./env.js";

const app = createApp();
app.listen(env.port, "0.0.0.0", () => {
  console.log(`myguruva-public-api listening on http://0.0.0.0:${env.port}`);
});
