import express, { Request, Response, Express } from "express";
import { config } from "./Config.js";

export const ExpressApp: Express = express();

ExpressApp.get("/", (req: Request, res: Response) => {
  res.send(config.system.web_message);
});

ExpressApp.listen(3000, () => {
  console.log(config.system.bot_loading_message);
});
