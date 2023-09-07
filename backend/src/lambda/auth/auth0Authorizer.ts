import { CustomAuthorizerEvent, CustomAuthorizerResult } from "aws-lambda";
import "source-map-support/register";

import { verify, decode } from "jsonwebtoken";
import { createLogger } from "../../utils/logger";
import Axios from "axios";
import { Jwt } from "../../auth/Jwt";
import { JwtPayload } from "../../auth/JwtPayload";

const logger = createLogger("auth");

const jwksUrl =
  "https://dev-6vinkg53czxpsbf7.us.auth0.com/.well-known/jwks.json";

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info("Authorizing a user", event.authorizationToken);
  try {
    const jwtToken = await verifyToken(event.authorizationToken);
    logger.info("User was authorized", jwtToken);

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: "*",
          },
        ],
      },
    };
  } catch (e) {
    logger.error("User not authorized", { error: e.message });

    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Deny",
            Resource: "*",
          },
        ],
      },
    };
  }
};

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  let options = {
    headers: {
      Authorization: authHeader,
    },
  };
  let jwks;
  try {
    let response = await Axios.get(jwksUrl, options);
    jwks = response.data;
  } catch (e) {
    logger.error("Error retrieving JWKS", { error: e.message });
  }

  const token = getToken(authHeader);
  const jwt: Jwt = decode(token, { complete: true }) as Jwt;
  const kid = jwt.header["kid"];

  const signingKey = jwks.keys.find((key) => key.kid === kid);

  let cert = signingKey.x5c[0].match(/.{1,64}/g).join("\n");
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return verify(token, cert, { algorithms: ["RS256"] }) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error("No authentication header");

  if (!authHeader.toLowerCase().startsWith("bearer "))
    throw new Error("Invalid authentication header");

  const split = authHeader.split(" ");
  const token = split[1];

  return token;
}