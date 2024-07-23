import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "crypto";

export async function transactionsRoutes(app: FastifyInstance) {
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

      res.status(201).send();
    }
  );
}
