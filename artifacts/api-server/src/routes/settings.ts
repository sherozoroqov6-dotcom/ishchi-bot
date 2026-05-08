import { Router, type IRouter } from "express";
import { botState } from "../bot/state.js";

const router: IRouter = Router();

router.get("/settings", (_req, res) => {
  res.json(botState.getSettings());
});

router.put("/settings", (req, res) => {
  const updated = botState.updateSettings(req.body);
  res.json(updated);
});

export default router;
