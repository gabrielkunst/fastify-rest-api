import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "crypto";
import { checkCookieSessionId } from "../middlewares/check-cookie-session-id";

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export async function transactionsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
      preHandler: [checkCookieSessionId],
      schema: {
        response: {
          200: z.object({
            transactions: z.array(
              z.object({
                id: z.string().uuid(),
                session_id: z.string().uuid().optional().nullable(),
                title: z.string(),
                amount: z.number(),
                created_at: z.string(),
              })
            ),
          }),
        },
      },
    },
    async (req, res) => {
      const sessionId = req.cookies.sessionId;

      const transactions = await knex("transactions")
        .select("*")
        .where("session_id", sessionId);

      return res.status(200).send({ transactions });
    }
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/summary",
    {
      preHandler: [checkCookieSessionId],
      schema: {
        response: {
          200: z.object({
            summary: z.object({
              amount: z.number(),
            }),
          }),
        },
      },
    },
    async (req, res) => {
      const sessionId = req.cookies.sessionId;

      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amount", {
          as: "amount",
        })
        .first();

      return res.status(200).send({
        summary: {
          amount: summary?.amount ?? 0,
        },
      });
    }
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
      preHandler: [checkCookieSessionId],
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            transaction: z.object({
              id: z.string().uuid(),
              session_id: z.string().uuid().optional().nullable(),
              title: z.string(),
              amount: z.number(),
              created_at: z.string(),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (req, res) => {
      const sessionId = req.cookies.sessionId;
      const { id } = req.params;

      const transaction = await knex("transactions")
        .select("*")
        .where({
          id,
          session_id: sessionId,
        })
        .first();

      if (!transaction) {
        return res.status(404).send({
          message: "Transaction with provided ID was not found.",
        });
      }

      return res.status(200).send({
        transaction,
      });
    }
  );

  app.withTypeProvider<ZodTypeProvider>().post(
    "/",
    {
      schema: {
        body: z.object({
          title: z.string().min(1),
          amount: z.number().positive(),
          type: z.enum(["income", "expense"]),
        }),
        response: {
          201: z.void(),
        },
      },
    },
    async (req, res) => {
      const { title, amount, type } = req.body;

      let sessionId = req.cookies.sessionId;

      if (!sessionId) {
        sessionId = randomUUID();

        res.cookie("sessionId", sessionId, {
          path: "/",
          maxAge: SEVEN_DAYS_IN_SECONDS,
        });
      }

      await knex("transactions").insert({
        id: randomUUID(),
        title,
        amount: type === "income" ? amount : amount * -1,
        session_id: sessionId,
      });

      return res.status(201).send();
    }
  );
}
