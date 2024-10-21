import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from "@solana/actions"
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "@/../anchor/target/types/voting";
import { BN, Program } from "@coral-xyz/anchor";

const IDL = require("@/../anchor/target/idl/voting.json");

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon:"https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ294Zmg5Z2VzM3BnaDFnam9pdDk4aHl5dmJqdzk4ZzA2dm9zNzc1ayZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Bco5Bt4kYnUcHwHdu7/giphy.gif",
    title: "Vote for your favorite type of peanut butter!",
    description: "Vote between Smooth and Crunchy peanut butter!",
    label: "Vote",
    links: { 
      actions: [
        {
          label: "Vote for Smooth",
          href: "/api/vote?candidate=Smooth",
          type: "transaction"
        },
        {
          label: "Vote for Crunchy",
          href: "/api/vote?candidate=Crunchy",
          type: "transaction"
        }
      ]
    },
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS});
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate != "Smooth" && candidate != "Crunchy") {
    return new Response("Missing candidate parameter", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<Voting> = new Program(IDL, {connection});

  const body: ActionPostRequest = await request.json();
  let voter;

  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid account", { status: 400, headers: ACTIONS_CORS_HEADERS });
  }

  const instruction = await program.methods
   .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
     })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: "transaction",
    }
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });

}