import "source-map-support/register";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import * as middy from "middy";
import { cors } from "middy/middlewares";

import { updateTodo, getTodosForUser } from "../../helpers/todos";
import { getUserId } from "../utils";
import { UpdateTodoRequest } from "../../requests/UpdateTodoRequest";

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    const todoId = event.pathParameters.todoId;
    const updateTodoRequest: UpdateTodoRequest = JSON.parse(event.body);
    try {
      await updateTodo(todoId, getUserId(event), updateTodoRequest);
      const todos = await getTodosForUser(getUserId(event));
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          items: todos.Items,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: err,
        }),
      };
    }
  }
);

handler.use(
  cors({
    credentials: true,
  })
);