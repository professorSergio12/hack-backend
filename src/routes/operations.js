import { Router } from "express";
import { findOperationByReference } from "../services/zohoCreator.js";
import { config } from "../config/env.js";

const router = Router();

/** GET /api/operations/:referenceNumber — lookup operation in Creator */
router.get("/:referenceNumber", async (req, res) => {
  try {
    if (!config.zoho.clientId) {
      return res.status(503).json({ error: "Zoho Creator not configured" });
    }

    const operation = await findOperationByReference(req.params.referenceNumber);
    if (!operation) {
      return res.status(404).json({ error: "Operation not found" });
    }

    res.json({ id: operation.id, data: operation.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
