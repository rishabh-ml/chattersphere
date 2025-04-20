import { Schema, model, models } from "mongoose";

const NewsletterSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is required."],
        unique: true,
        match: [/.+@.+\..+/, "Please enter a valid email address."],
    },
    subscribedAt: {
        type: Date,
        default: Date.now,
    },
});

// If model exists (during hot reloads), reuse it
export const Newsletter = models.Newsletter || model("Newsletter", NewsletterSchema);
