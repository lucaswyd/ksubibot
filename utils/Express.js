import express from "express";
import { web_message, bot_loading_message } from "./Config.js";

export const ExpressApp = express();

ExpressApp.get("/", (req, res) => {
  res.send(web_message);
});

ExpressApp.listen(3000, () => {
  console.log(bot_loading_message);
});
