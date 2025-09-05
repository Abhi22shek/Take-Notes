import { AuthRequest } from "../middleware/authMiddleware";
import { Response, NextFunction } from "express";
import { Note } from "../models/Notes";
import { sendResponse } from "../utils/response";
import { AppError } from "../middleware/errorMiddleware";

export const createNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
       
        const { title, content } = req.body;
        
        if (!title || !content) {
            return next(new AppError('Title and content are required', 400));
        }

        const note = new Note({
            userId: req.user?.id,
            title,
            content
        });

        await note.save();

        sendResponse(res, 201, 'Note created successfully', note);
    } catch (error) {
        next(error);
    }
}

export const deleteNotes = async (req:AuthRequest,res:Response, next: NextFunction) => {
    try {
        const {id} = req.params;

        const note = await Note.findOneAndDelete({
            _id:id,
            userId:req.user!.id
        })

        if(!note){
            return next(new AppError('Note not found', 404));
        }

        sendResponse(res, 200, 'Note deleted successfully');
    } catch (error) {
        next(error);
    }
}



export const updateNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const updateData = req.body;

    const note = await Note.findOneAndUpdate(
      { _id: id, userId: req.user!.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!note) {
      return next(new AppError('Note not found', 404));
    }

    sendResponse(res, 200, 'Note updated successfully', note);
  } catch (error) {
    next(error);
  }
};


export const getNotes = async (req:AuthRequest,res:Response, next: NextFunction) => {
    try {
        const notes = await Note.find({userId:req.user!.id}).sort({createdAt:-1})

        if(!notes){
            return next(new AppError('Notes not found', 404));
        }

        sendResponse(res, 200, 'Notes retrieved successfully', notes);
    } catch (error) {
       next(error);
    }
}