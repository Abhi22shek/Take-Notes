import { AuthRequest } from "../middleware/authMiddleware";
import { Response } from "express";
import { Note } from "../models/Notes";

export const createNotes = async (req: AuthRequest, res: Response) => {
    try {
       
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ message: "Title and content required" });
        }

        const note = new Note({
            userId: req.user?.id,
            title,
            content
        });

        await note.save();

        res.status(201).json({
            note,
            message: "Notes created"
        });
    } catch (error) {
        console.log(error, "server error");
        res.status(500).json({ message: "Failed to create note" });
    }
}

export const deleteNotes = async (req:AuthRequest,res:Response) => {
    try {
        const {id} = req.params;

        const note = await Note.findOneAndDelete({
            _id:id,
            userId:req.user!.id
        })

        if(!note){
            return res.status(400).json({
                message:"Note not found"
            })
        }

        res.status(200).json({
           message: "Note deleted successfuly"
        })
    } catch (error) {
        res.status(500).json({
            message:"server error",
            error
        })
    }
}



export const updateNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Whatever fields the user sends (title, content, etc.)
    const updateData = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: req.user!.id }, // filter
      { $set: updateData },              // update
      { new: true, runValidators: true } // options
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    res.status(200).json({
      note,
      message: "Note updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      error,
      message: "Server Error",
    });
  }
};


export const getNotes = async (req:AuthRequest,res:Response) => {
    try {
        const notes = await Note.find({userId:req.user!.id}).sort({createdAt:-1})

        if(!notes){
            res.status(400).json("notes are not found")
        }

        res.status(201).json({
            notes
        })
    } catch (error) {
       return res.status(500).json({
            error,
           message: "server error",
        })
    }
}