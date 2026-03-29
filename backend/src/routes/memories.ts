import express, { Request, Response } from "express";
import Memory from "../models/Memory";
import { requireAuthStrict } from "../utils/auth";

const router = express.Router();

// Get all memories for a user
router.get("/:userId", async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const memories = await Memory.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(memories);
    } catch (error: any) {
        console.error("Error fetching memories:", error);
        res.status(500).json({ error: "خطأ في جلب الذكريات" });
    }
});

// Create or update a memory for the current user
router.post("/", requireAuthStrict, async (req: Request, res: Response) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) {
            return res.status(401).json({ error: "غير مصرح لك بالوصول" });
        }

        const { monthLabel, items, trackIndex } = req.body;
        
        if (!monthLabel || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: "بيانات الذكرى غير مكتملة" });
        }

        // Check 3-memory limit for NEW memories (not updates)
        const currentCount = await Memory.countDocuments({ userId });
        const existing = await Memory.findOne({ userId, monthLabel });
        
        if (!existing && currentCount >= 3) {
            return res.status(400).json({ error: "لقد وصلت للحد الأقصى (3 ذكريات). يرجى حذف ذكرى قديمة لإنشاء واحدة جديدة." });
        }

        // Create or Update
        const updatedMemory = await Memory.findOneAndUpdate(
            { userId, monthLabel },
            { $set: { items, trackIndex, createdAt: new Date() } },
            { upsert: true, new: true }
        );

        res.status(201).json(updatedMemory);
    } catch (error: any) {
        console.error("Error saving memory:", error);
        res.status(500).json({ error: "خطأ في حفظ الذكرى" });
    }
});

// Delete a memory
router.delete("/:id", requireAuthStrict, async (req: Request, res: Response) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        
        const deleted = await Memory.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.status(404).json({ error: "الذكرى غير موجودة أو لا تملك صلاحية الحذف" });
        }
        
        res.status(200).json({ message: "تم حذف الذكرى بنجاح" });
    } catch (error: any) {
        console.error("Error deleting memory:", error);
        res.status(500).json({ error: "خطأ في حذف الذكرى" });
    }
});

export default router;
