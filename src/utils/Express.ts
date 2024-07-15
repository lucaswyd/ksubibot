import express, { Request, Response, Express } from "express";
import { web_message, bot_loading_message } from "./Config.js";

export const ExpressApp: Express = express();

ExpressApp.get("/", (req: Request, res: Response) => {
  res.send(web_message);
});

ExpressApp.listen(3000, () => {
  console.log(bot_loading_message);
});
