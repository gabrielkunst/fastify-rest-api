import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "crypto";

export async function transactionsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/",
    {
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
      const transactions = await knex("transactions").select("*");

      return res.status(200).send({ transactions });
    }
  );

  app.withTypeProvider<ZodTypeProvider>().get(
    "/:id",
    {
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
        },
      },
    },
    async (req, res) => {
      const { id } = req.params;

      const transaction = await knex("transactions")
        .select("*")
        .where("id", id)
        .first();

      if (!transaction) {
        throw new Error("Transaction with provided ID was not found.");
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

      await knex("transactions").insert({
        id: randomUUID(),
        title,
        amount: type === "income" ? amount : amount * -1,
      });

      return res.status(201).send();
    }
  );
}
