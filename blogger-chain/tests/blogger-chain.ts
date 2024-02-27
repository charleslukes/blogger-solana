import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { BloggerChain } from "../target/types/blogger_chain";
import { Commitment, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { randomBytes } from "crypto";

describe("blogger-chain", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const commitment: Commitment = "confirmed";

  const program = anchor.workspace.BloggerChain as Program<BloggerChain>;

  const wallet1 = new Keypair();
  const wallet2 = new Keypair();
  const wallet3 = new Keypair();

  // SEED
  const blog_id = new BN(randomBytes(8));
  const blog_id2 = new BN(randomBytes(8));

  // const title = Buffer.from("Hello World");

  // PDA
  const blogPda = PublicKey.findProgramAddressSync(
    [
      Buffer.from("blog"),
      blog_id.toBuffer().reverse(),
      wallet1.publicKey.toBytes(),
    ],
    program.programId
  )[0];

   // PDA2
   const blogPda2 = PublicKey.findProgramAddressSync(
    [
      Buffer.from("blog"),
      blog_id2.toBuffer().reverse(),
      wallet1.publicKey.toBytes(),
    ],
    program.programId
  )[0];

  it("Airdrop", async () => {
    await Promise.all(
      [wallet1, wallet2, wallet3].map(async (k) => {
        return await anchor
          .getProvider()
          .connection.requestAirdrop(
            k.publicKey,
            100 * anchor.web3.LAMPORTS_PER_SOL
          );
      })
    )
      .then(confirmTxs)
      .catch((e) => {
        console.log(e);
      });
  });

  it("Create post", async () => {
    const tx = await program.methods
      .postBlog(
        blog_id,
        "Hello World",
        "www.helloworld.com",
        "This is an hello world description",
        new BN([0]).toBuffer().reverse()
      )
      .accounts({
        signer: wallet1.publicKey,
        blogState: blogPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet1])
      .rpc({
        commitment,
      });
    await confirmTx(tx);

    const accountData = await program.account.blogState.fetch(blogPda);
    console.log({accountData});
  });

  it("Create edit", async () => {
    const tx = await program.methods
      .editBlog(
        blog_id,
        "Hellooooooo",
        "www.helloooooo.com",
        "This is an hellooooooo description",
        new BN([1]).toBuffer().reverse()
      )
      .accounts({
        signer: wallet2.publicKey,
        blogState: blogPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([wallet2])
      .rpc({
        commitment,
      });
    await confirmTx(tx);

    const accountData = await program.account.blogState.fetch(blogPda);
    console.log({accountData});
  });

  // Helpers
  const confirmTx = async (signature: string) => {
    const latestBlockhash = await anchor
      .getProvider()
      .connection.getLatestBlockhash();
    await anchor.getProvider().connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      commitment
    );

  };

  const confirmTxs = async (signatures: string[]) => {
    await Promise.all(signatures.map(confirmTx));
  };
});
