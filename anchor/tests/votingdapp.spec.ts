import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { BankrunProvider, startAnchor } from "anchor-bankrun";


import { Voting } from '../target/types/voting'
const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF")

describe('Voting', () => {

  let context;
  let provider;
  let votingProgram: any;

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: votingAddress }], []);
    provider = new BankrunProvider(context)

    votingProgram = new Program<Voting>(
      IDL,
      provider
    )
  })

  it('Initialize Poll', async () => {

    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "what is your favourite type of peanaut Butter",
      new anchor.BN(0),
      new anchor.BN(1821246481),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(poll);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual('what is your favorite type of peanut butter');
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  })



  it('Initialize candidate', async () => {
    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new anchor.BN(1),
    ).rpc();

    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new anchor.BN(1),
    ).rpc();

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Crunchy')],
      votingAddress
    )

    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress);
    expect(crunchyCandidate.candidateVotes.toNumber()).toEqual(0);


    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Smooth')],
      votingAddress
    )

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(0);

  })

  it('vote', async () => {
    await votingProgram.methods.vote(
      "Smooth",
      new anchor.BN(1)
    ).rpc()

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Smooth')],
      votingAddress
    )

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress);

    expect(smoothCandidate.candidateVotes.toNumber()).toEqual(1);

  })
})
