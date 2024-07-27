import request from "supertest";
import { execSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../app";
import { beforeEach } from "node:test";

describe("Transactions Route", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex -- migrate:rollback --all");
    execSync("npm run knex -- migrate:latest");
  });

  it.todo(
    "should not be able to create transaction without title",
    async () => {}
  );

  it.todo(
    "should not be able to create transaction without amount",
    async () => {}
  );

  it.todo(
    "should not be able to create transaction without type",
    async () => {}
  );

  it("should be able to create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "Freelance",
        amount: 100,
        type: "income",
      })
      .expect(201);
  });

  it("should be able to list the transactions", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Keyboard",
        amount: 100,
        type: "expense",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    if (!cookies) {
      throw new Error("Cookie not found in response");
    }

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: "Keyboard",
        amount: -100,
      }),
    ]);
  });

  it("should be able to get a transaction by id", async () => {
    const createTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Car",
        amount: 500,
        type: "expense",
      });

    const cookies = createTransactionResponse.get("Set-Cookie");

    if (!cookies) {
      throw new Error("Cookie not found in response");
    }

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const firstTransactionId = listTransactionsResponse.body.transactions[0].id;

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${firstTransactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "Car",
        amount: -500,
      })
    );
  });

  it("should be able to get the balance", async () => {
    const firstTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Wage",
        amount: 1000,
        type: "income",
      });

    const cookies = firstTransactionResponse.get("Set-Cookie");

    if (!cookies) {
      throw new Error("Cookie not found in response");
    }

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Car",
        amount: 500,
        type: "expense",
      });

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .send();

    expect(summaryResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: 500,
      })
    );
  });
});
