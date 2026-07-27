import type { Request, Response } from "express";
import { todoValidationSchema, type ITodo } from "../validation/todo.schema.js";

class TodoController {
  private _db: ITodo[];

  constructor() {
    this._db = [];
  }

  public handleGetAllTodos(req: Request, res: Response) {
    return res.json({ todos: this._db });
  }

  public handleGetTodo(req: Request, res: Response) {
    const id = req.params.id as string;
    const todo = this._db.find((item) => item.id === id);
    if (!todo) return res.status(404).json({ error: "Todo not found" });

    return res.json({ todo });
  }

  public async handleInsertTodo(req: Request, res: Response) {
    try {
      const rawBody = req.body;
      const validationResult = await todoValidationSchema.parseAsync(rawBody);
      this._db.push(validationResult);
      return res.status(201).json({ todo: validationResult });
    } catch (error) {
      return res
        .status(500)
        .json({ error: { errorMessage: "Validation Failed", error } });
    }
  }

  public async handleUpdateTodo(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const rawBody = req.body;
      const index = this._db.findIndex((item) => item.id === id);
      if (index === -1)
        return res.status(404).json({ error: "Todo not found" });

      const validationResult = await todoValidationSchema.parseAsync(rawBody);

      const updatedTodo = { ...validationResult, id };
      this._db[index] = updatedTodo;
      return res.json({ todo: updatedTodo });
    } catch (error) {
      return res
        .status(500)
        .json({ error: { errorMessage: "Validation Failed", error } });
    }
  }

  public handleDeleteTodo(req: Request, res: Response) {
    const id = req.params.id as string;
    const initialLength = this._db.length;
    this._db = this._db.filter((item) => item.id !== id);

    if (this._db.length === initialLength)
      return res.status(404).json({ error: "Todo not found" });

    return res.status(204).send();
  }
}

export default TodoController;
