import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import "source-map-support/register";
import * as middy from "middy";
import { cors } from "middy/middlewares";
import { CreateTodoRequest } from "../../requests/CreateTodoRequest";
import { getUserId } from "../utils";
import { createTodo } from "../../helpers/todos";
import { createLogger } from "../../utils/logger";

const logger = createLogger("createTodo");
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body);
    const userId: string = getUserId(event);

    try {
      if (!newTodo.name) {
        return {
          statusCode: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ msg: "Can not be blank!" }),
        };
      }
      const response = await createTodo(newTodo, userId);

      return {
        statusCode: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          item: response,
        }),
      };
    } catch (err) {
      logger.error("Unable to complete the create Todo Operation for user", {
        userId: userId,
        error: err,
      });
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