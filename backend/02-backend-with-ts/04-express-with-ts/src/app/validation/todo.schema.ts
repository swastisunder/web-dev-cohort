import { z } from "zod";

export const todoValidationSchema = z.object({
  id: z.string().describe("ID of the todo"),
  title: z.string().describe("title of the todo"),
  description: z.string().optional().describe("description of todo"),
  isCompleted: z
    .boolean()
    .default(false)
    .describe("if the todo is compeleted or not"),
});

export type ITodo = z.infer<typeof todoValidationSchema>;
// export interface ITodo {
//   id: string;
//   title: string;
//   description?: string;
//   isCompleted: boolean;
// }
