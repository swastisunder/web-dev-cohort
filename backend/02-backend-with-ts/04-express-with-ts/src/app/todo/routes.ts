import { Router } from "express";
import TodoController from "./controller.js";

const router = Router();
const controller = new TodoController();

router.get("/", controller.handleGetAllTodos.bind(controller));
router.get("/:id", controller.handleGetTodo.bind(controller));
router.post("/", controller.handleInsertTodo.bind(controller));
router.put("/:id", controller.handleUpdateTodo.bind(controller));
router.delete("/:id", controller.handleDeleteTodo.bind(controller));

export default router;
