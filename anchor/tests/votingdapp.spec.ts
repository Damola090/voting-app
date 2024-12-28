import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";


import { Voting } from '../target/types/voting'
// Step 1 -- copy SO file directly into test/fixtures/
// Step 2 -- import IDL FIle 
// step 3 -- import the Voting Type from target/types/voting.ts 
// Step 4 -- Create Context and Provider that allows us to interact wih the smart contract
// Step 5 -- Create Voting Program instance using IDL and Provider
// Step 6 -- Derive PDA 
// Step 7 -- call Program Method 

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF")

describe('Voting', () => {

  let context;
  let provider;
  let votingProgram: any;
  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    provider = new BankrunProvider(context);

    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  })

  it('Initialize Poll', async () => {
    const pollId = new anchor.BN(1);

    // Derive the poll account address
    const [pollAddress] = await PublicKey.findProgramAddress(
      [Buffer.from("poll"), pollId.toBuffer("le", 8)],
      votingAddress
    );

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      new anchor.BN(0),
      new anchor.BN(1759508293),
      "test-poll",
      "description",
    ).rpc();

    const pollAccount = await votingProgram.account.pollAccount.fetch(pollAddress);
    console.log(pollAccount);
  })

  it('initialize candidates', async () => {
    const pollIdBuffer = new anchor.BN(1).toArrayLike(Buffer, "le", 8)

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollIdBuffer],
      votingProgram.programId
    );

    const smoothTx = await votingProgram.methods.initializeCandidate(
      new anchor.BN(1),
      "smooth",
    ).accounts({
      pollAccount: pollAddress
    })
      .rpc();

    const crunchyTx = await votingProgram.methods.initializeCandidate(
      new anchor.BN(1),
      "crunchy",
    ).accounts({
      pollAccount: pollAddress
    })
      .rpc();

    console.log('Your transaction signature', smoothTx);
  });

  it("vote", async () => {

    const pollIdBuffer = new anchor.BN(1).toArrayLike(Buffer, "le", 8)

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("poll"), pollIdBuffer],
      votingAddress
    );

    const [candidateAddress] = PublicKey.findProgramAddressSync(
      [pollIdBuffer, Buffer.from("smooth")],
      votingAddress
    );

    await votingProgram.methods
      .vote(
        "smooth",
        new anchor.BN(1)
      )
      .accounts({
        pollAccount: pollAddress,
        candidateAccount: candidateAddress,
      })
      .rpc()

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("smooth")],
      votingAddress,
    );

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);
    console.log(smoothCandidate);
    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);
  });
})
