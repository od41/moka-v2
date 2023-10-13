"use client";

import Link from "next/link";
import { serif } from "../layout";

export default function Publish() {
  return (<>
  <main className="w-screen h-screen flex items-center justify-center px-4">

  <div className="text-center max-w-[320px]">
    <h2 style={serif.style} className="text-xl mb-3">Under Development</h2>
    <p className="text-lg text-slate-800 leading-snug">Please visit the <Link className="font-semibold text-[#3F305B] " href="https://testnet.mintbase.xyz/contract/mokastore.mintspace2.testnet/nfts/all/0">Moka store</Link> on Mintbase to publish your book</p>
  </div>
  </main>
  </>);
}