import { createApp } from "./app";

const app = createApp();
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`saavn/api listening on http://localhost:${port}`);
});
