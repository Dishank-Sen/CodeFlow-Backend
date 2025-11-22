import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
    file: {
        type: String,
        required: true,
    },
    type: {
        type: String
    },
    action: {
        type: String,
        required: true,
    },
    content: {
        type: String,
    },
    timestamp: {
        type: String,
        required: true,
    }
})

export default historySchema