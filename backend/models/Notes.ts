import mongoose , {Document, Schema}  from "mongoose";

export interface INote extends Document {
    userId:mongoose.Types.ObjectId,
    title:string,
    content:string
    createdAt:Date
}

const noteSchema = new Schema<INote>(
    {
        userId:{type:Schema.Types.ObjectId , ref:"User"},
        title:{type:String,required:true},
        content:{type:String, required:true},
    },

    {timestamps:true}
    
)

export const Note =  mongoose.model<INote>("Note" ,noteSchema)