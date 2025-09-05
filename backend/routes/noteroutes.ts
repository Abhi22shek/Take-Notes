import {Router} from "express";
import { Authmiddleware } from "../middleware/authMiddleware";
import { createNotes, deleteNotes, getNotes, updateNotes } from "../controller/notesController";

const router =  Router();

router.put("/:id", Authmiddleware,updateNotes);
router.delete("/:id", Authmiddleware,deleteNotes);
router.post("/",Authmiddleware,createNotes)
router.get("/", Authmiddleware,getNotes)


export default router